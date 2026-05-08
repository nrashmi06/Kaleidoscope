package com.kaleidoscope.backend.async.consumer;

import com.kaleidoscope.backend.async.dto.FaceRecognitionResultDTO;
import com.kaleidoscope.backend.async.exception.async.StreamDeserializationException;
import com.kaleidoscope.backend.async.exception.async.StreamMessageProcessingException;
import com.kaleidoscope.backend.posts.document.MediaSearchDocument;
import com.kaleidoscope.backend.posts.enums.FaceDetectionStatus;
import com.kaleidoscope.backend.posts.model.MediaDetectedFace;
import com.kaleidoscope.backend.posts.repository.MediaDetectedFaceRepository;
import com.kaleidoscope.backend.posts.repository.search.MediaSearchRepository;
import com.kaleidoscope.backend.readmodels.repository.FaceSearchReadModelRepository;
import com.kaleidoscope.backend.readmodels.repository.MediaSearchReadModelRepository;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class FaceRecognitionConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private static final int FACE_RESOLVE_MAX_ATTEMPTS = 20;   // ~3 seconds total
    private static final long FACE_RESOLVE_DELAY_MS = 150L;

    private final MediaDetectedFaceRepository mediaDetectedFaceRepository;
    private final UserRepository userRepository;
    private final FaceSearchReadModelRepository faceSearchReadModelRepository;
    private final MediaSearchReadModelRepository mediaSearchReadModelRepository;
    private final MediaSearchRepository mediaSearchRepository;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        String messageId = record.getId().getValue();
        Map<String, String> value = record.getValue();
        String correlationId = value.get("correlationId");

        try (var ignored = MDC.putCloseable("correlationId", correlationId)) {
            log.info("Received face recognition message from Redis Stream: streamKey={}, messageId={}",
                    record.getStream(), messageId);

            FaceRecognitionResultDTO resultDTO = convertMapRecordToDTO(record);
            log.info("Successfully deserialized face recognition for faceId: {}, suggestedUserId: {}, confidence: {}",
                    resultDTO.getFaceId(), resultDTO.getSuggestedUserId(), resultDTO.getConfidenceScore());

            MediaDetectedFace detectedFace = resolveDetectedFaceWithRetry(resultDTO);
            if (detectedFace == null) {
                log.warn("Could not resolve detected-face row after retry window. Leaving in PEL for retry. mediaId={} faceId={} correlationId={}",
                        resultDTO.getMediaId(), resultDTO.getFaceId(), resultDTO.getCorrelationId());
                throw new StreamMessageProcessingException(
                        record.getStream(),
                        messageId,
                        "Detected face row not yet available for mediaId=" + resultDTO.getMediaId() + ", faceId=" + resultDTO.getFaceId()
                );
            }

            log.info("Resolved MediaDetectedFace row: detectedFaceId={}, mediaId={}",
                    detectedFace.getId(), detectedFace.getMediaAiInsights().getMediaId());

            Optional<User> suggestedUserOpt = userRepository.findById(resultDTO.getSuggestedUserId());
            if (suggestedUserOpt.isEmpty()) {
                log.warn("Suggested user not found for suggestedUserId: {}. Marking faceId={} as UNIDENTIFIED and acknowledging message.",
                        resultDTO.getSuggestedUserId(), detectedFace.getId());

                detectedFace.setSuggestedUser(null);
                detectedFace.setConfidenceScore(null);
                detectedFace.setStatus(FaceDetectionStatus.UNIDENTIFIED);
                MediaDetectedFace updatedFace = mediaDetectedFaceRepository.save(detectedFace);

                String faceIdString = String.valueOf(updatedFace.getId());
                faceSearchReadModelRepository.findByFaceId(faceIdString)
                        .ifPresent(faceSearch -> {
                            faceSearch.setIdentifiedUserId(null);
                            faceSearch.setIdentifiedUsername(null);
                            faceSearch.setMatchConfidence(null);
                            faceSearchReadModelRepository.save(faceSearch);
                            log.info("Updated read_model_face_search to UNIDENTIFIED for faceId: {}", faceIdString);
                        });

                log.info("Processed face recognition for faceId={} messageId={} - user missing, marked UNIDENTIFIED",
                        resultDTO.getFaceId(), messageId);
                return;
            }

            User suggestedUser = suggestedUserOpt.get();
            log.info("Retrieved suggested User: userId={}, username={}",
                    suggestedUser.getUserId(), suggestedUser.getUsername());

            updateDetectedFaceWithRecognition(detectedFace, suggestedUser, resultDTO.getConfidenceScore());
            MediaDetectedFace updatedFace = mediaDetectedFaceRepository.save(detectedFace);
            log.info("Updated MediaDetectedFace for faceId: {}, status: {}, suggestedUser: {}, confidence: {}",
                    updatedFace.getId(), updatedFace.getStatus(), updatedFace.getSuggestedUser().getUsername(),
                    updatedFace.getConfidenceScore());

            String faceIdString = String.valueOf(updatedFace.getId());
            faceSearchReadModelRepository.findByFaceId(faceIdString)
                    .ifPresentOrElse(faceSearch -> {
                        faceSearch.setIdentifiedUserId(suggestedUser.getUserId());
                        faceSearch.setIdentifiedUsername(suggestedUser.getUsername());
                        faceSearch.setMatchConfidence(updatedFace.getConfidenceScore());
                        faceSearchReadModelRepository.save(faceSearch);
                        log.info("Updated read_model_face_search for faceId: {}", faceIdString);

                        updateMediaSearchWithDetectedUser(updatedFace.getMediaAiInsights().getMediaId(), suggestedUser);
                    }, () -> log.warn("Could not find matching FaceSearchReadModel for faceId: {}", faceIdString));

            log.info("Successfully processed face recognition for incoming faceId={} messageId={} -> detectedFaceId={} suggestedUser={}",
                    resultDTO.getFaceId(), messageId, updatedFace.getId(), suggestedUser.getUsername());

        } catch (StreamDeserializationException e) {
            log.error("Error processing face recognition message from Redis Stream: messageId={}, error={}. Message will remain in PEL.",
                    messageId, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error processing face recognition message from Redis Stream: messageId={}, error={}. Message will remain in PEL.",
                    messageId, e.getMessage(), e);
            throw new StreamMessageProcessingException(record.getStream(), messageId,
                    "Unexpected error during face recognition processing", e);
        }
    }

    private MediaDetectedFace resolveDetectedFaceWithRetry(FaceRecognitionResultDTO dto) {
        for (int attempt = 1; attempt <= FACE_RESOLVE_MAX_ATTEMPTS; attempt++) {
            MediaDetectedFace resolved = resolveDetectedFaceOnce(dto);
            if (resolved != null) {
                if (attempt > 1) {
                    log.info("Resolved detected-face on retry attempt {}/{} for mediaId={} faceId={}",
                            attempt, FACE_RESOLVE_MAX_ATTEMPTS, dto.getMediaId(), dto.getFaceId());
                }
                return resolved;
            }

            if (attempt < FACE_RESOLVE_MAX_ATTEMPTS) {
                safeSleep(FACE_RESOLVE_DELAY_MS);
            }
        }
        return null;
    }

    private MediaDetectedFace resolveDetectedFaceOnce(FaceRecognitionResultDTO dto) {
        if (dto.getMediaId() == null || dto.getFaceId() == null || dto.getFaceId().isBlank()) {
            return null;
        }

        // 1) Numeric faceId path (legacy)
        Long numericFaceId = tryParseLong(dto.getFaceId());
        if (numericFaceId != null) {
            Optional<MediaDetectedFace> byId =
                    mediaDetectedFaceRepository.findByIdAndMediaAiInsights_MediaId(numericFaceId, dto.getMediaId());
            if (byId.isPresent()) {
                return byId.get();
            }
        }

        // 2) UUID/non-numeric fallback path:
        //    choose highest-confidence UNIDENTIFIED face for this media.
        List<MediaDetectedFace> unresolvedCandidates =
                mediaDetectedFaceRepository.findUnidentifiedByMediaIdOrderByConfidenceDesc(dto.getMediaId());
        if (!unresolvedCandidates.isEmpty()) {
            return unresolvedCandidates.get(0);
        }

        return null;
    }

    private void safeSleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private Long tryParseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void updateMediaSearchWithDetectedUser(Long mediaId, User detectedUser) {
        mediaSearchReadModelRepository.findById(mediaId).ifPresentOrElse(mediaSearch -> {
            String userIdStr = String.valueOf(detectedUser.getUserId());
            String username = detectedUser.getUsername();

            String currentIds = mediaSearch.getDetectedUserIds();
            if (currentIds == null || currentIds.isEmpty()) {
                mediaSearch.setDetectedUserIds(userIdStr);
            } else if (!Arrays.asList(currentIds.split(",")).contains(userIdStr)) {
                mediaSearch.setDetectedUserIds(currentIds + "," + userIdStr);
            }

            String currentUsernames = mediaSearch.getDetectedUsernames();
            if (currentUsernames == null || currentUsernames.isEmpty()) {
                mediaSearch.setDetectedUsernames(username);
            } else if (!Arrays.asList(currentUsernames.split(",")).contains(username)) {
                mediaSearch.setDetectedUsernames(currentUsernames + "," + username);
            }

            mediaSearchReadModelRepository.save(mediaSearch);
            log.info("Updated read_model_media_search for mediaId: {} with detected userId: {}", mediaId, userIdStr);

            mediaSearchRepository.save(toMediaSearchDocument(mediaSearch));
            log.info("Indexed media_search document for mediaId: {} after face recognition", mediaId);
        }, () -> log.warn("Could not find MediaSearchReadModel for mediaId: {} to add detected user", mediaId));
    }

    private MediaSearchDocument toMediaSearchDocument(com.kaleidoscope.backend.readmodels.model.MediaSearchReadModel media) {
        return MediaSearchDocument.builder()
                .id(String.valueOf(media.getMediaId()))
                .mediaId(media.getMediaId())
                .postId(media.getPostId())
                .mediaUrl(media.getMediaUrl())
                .aiCaption(media.getAiCaption())
                .aiTags(splitCsv(media.getAiTags()))
                .scenes(splitCsv(media.getAiScenes()))
                .isSafe(media.getIsSafe())
                .reactionCount(media.getReactionCount() != null ? media.getReactionCount().longValue() : 0L)
                .commentCount(media.getCommentCount() != null ? media.getCommentCount().longValue() : 0L)
                .createdAt(media.getCreatedAt() != null ? media.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toLocalDateTime() : null)
                .build();
    }

    private List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    private FaceRecognitionResultDTO convertMapRecordToDTO(MapRecord<String, String, String> record) {
        try {
            Map<String, String> values = record.getValue();
            log.debug("Converting MapRecord to FaceRecognitionResultDTO with {} fields", values.size());

            return FaceRecognitionResultDTO.builder()
                    .mediaId(parseLong(values.get("mediaId"), "mediaId"))
                    .postId(parseLong(values.get("postId"), "postId"))
                    .faceId(parseString(values.get("faceId")))
                    .suggestedUserId(parseLong(values.get("suggestedUserId"), "suggestedUserId"))
                    .matchedUsername(parseString(values.get("matchedUsername")))
                    .confidenceScore(parseDouble(values.get("confidenceScore"), "confidenceScore"))
                    .correlationId(parseString(values.get("correlationId")))
                    .build();
        } catch (Exception e) {
            log.error("Failed to convert MapRecord to FaceRecognitionResultDTO: {}", e.getMessage(), e);
            throw new StreamDeserializationException(record.getStream(), record.getId().getValue(),
                    "Failed to deserialize face recognition message", e);
        }
    }

    private Long parseLong(Object value, String field) {
        if (value == null) return null;
        String s = value.toString().trim();
        if (s.isEmpty()) return null;
        try {
            return Long.parseLong(s);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid numeric value for " + field + ": " + s, ex);
        }
    }

    private Double parseDouble(Object value, String field) {
        if (value == null) return null;
        String s = value.toString().trim();
        if (s.isEmpty()) return null;
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid decimal value for " + field + ": " + s, ex);
        }
    }

    private String parseString(Object value) {
        return value == null ? null : value.toString();
    }

    private void updateDetectedFaceWithRecognition(MediaDetectedFace detectedFace, User suggestedUser, Double confidenceScore) {
        log.debug("Updating MediaDetectedFace with recognition results: faceId={}, suggestedUserId={}, confidence={}",
                detectedFace.getId(), suggestedUser.getUserId(), confidenceScore);

        detectedFace.setSuggestedUser(suggestedUser);
        detectedFace.setConfidenceScore(confidenceScore.floatValue());
        detectedFace.setStatus(FaceDetectionStatus.SUGGESTED);
    }
}
