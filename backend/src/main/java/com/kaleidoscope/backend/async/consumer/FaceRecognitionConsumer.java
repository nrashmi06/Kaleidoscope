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

import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class FaceRecognitionConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private static final int FACE_RESOLVE_MAX_ATTEMPTS = 20;
    private static final long FACE_RESOLVE_DELAY_MS = 150L;

    private final MediaDetectedFaceRepository mediaDetectedFaceRepository;
    private final UserRepository userRepository;
    private final FaceSearchReadModelRepository faceSearchReadModelRepository;
    private final MediaSearchReadModelRepository mediaSearchReadModelRepository;
    private final MediaSearchRepository mediaSearchRepository;
    private final com.kaleidoscope.backend.async.service.RedisStreamPublisher redisStreamPublisher;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        String messageId = record.getId().getValue();
        Map<String, String> value = record.getValue();
        String correlationId = value.get("correlationId");

        try (var ignored = MDC.putCloseable("correlationId", correlationId)) {
            FaceRecognitionResultDTO resultDTO = convertMapRecordToDTO(record);

            MediaDetectedFace detectedFace = resolveDetectedFaceWithRetry(resultDTO);
            if (detectedFace == null) {
                throw new StreamMessageProcessingException(
                        record.getStream(),
                        messageId,
                        "Detected face row unavailable for mediaId=" + resultDTO.getMediaId() + ", faceId=" + resultDTO.getFaceId()
                );
            }

            Optional<User> suggestedUserOpt = userRepository.findById(resultDTO.getSuggestedUserId());
            if (suggestedUserOpt.isEmpty()) {
                detectedFace.setSuggestedUser(null);
                detectedFace.setConfidenceScore(null);
                detectedFace.setStatus(FaceDetectionStatus.UNIDENTIFIED);
                MediaDetectedFace updatedFace = mediaDetectedFaceRepository.save(detectedFace);
                syncFaceSearchAsUnidentified(updatedFace, correlationId);
                return;
            }

            User suggestedUser = suggestedUserOpt.get();
            detectedFace.setSuggestedUser(suggestedUser);
            detectedFace.setConfidenceScore(resultDTO.getConfidenceScore().floatValue());
            detectedFace.setStatus(FaceDetectionStatus.SUGGESTED);
            MediaDetectedFace updatedFace = mediaDetectedFaceRepository.save(detectedFace);

            syncFaceSearchAsSuggested(updatedFace, suggestedUser, correlationId);
            syncMediaSearchDetectedUser(updatedFace.getMediaAiInsights().getMediaId(), suggestedUser);
        } catch (StreamDeserializationException e) {
            throw e;
        } catch (Exception e) {
            throw new StreamMessageProcessingException(record.getStream(), messageId,
                    "Unexpected face recognition processing failure", e);
        }
    }

    private MediaDetectedFace resolveDetectedFaceWithRetry(FaceRecognitionResultDTO dto) {
        for (int attempt = 1; attempt <= FACE_RESOLVE_MAX_ATTEMPTS; attempt++) {
            MediaDetectedFace resolved = resolveDetectedFaceOnce(dto);
            if (resolved != null) {
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

        Long numericFaceId = tryParseLong(dto.getFaceId());
        if (numericFaceId != null) {
            Optional<MediaDetectedFace> byId =
                    mediaDetectedFaceRepository.findByIdAndMediaAiInsights_MediaId(numericFaceId, dto.getMediaId());
            if (byId.isPresent()) {
                return byId.get();
            }
        }

        List<MediaDetectedFace> unresolvedCandidates =
                mediaDetectedFaceRepository.findUnidentifiedByMediaIdOrderByConfidenceDesc(dto.getMediaId());
        if (!unresolvedCandidates.isEmpty()) {
            return unresolvedCandidates.get(0);
        }
        return null;
    }

    private void syncFaceSearchAsUnidentified(MediaDetectedFace updatedFace, String correlationId) {
        String faceIdString = String.valueOf(updatedFace.getId());
        faceSearchReadModelRepository.findByFaceId(faceIdString).ifPresent(faceSearch -> {
            faceSearch.setIdentifiedUserId(null);
            faceSearch.setIdentifiedUsername(null);
            faceSearch.setMatchConfidence(null);
            faceSearchReadModelRepository.save(faceSearch);
            publishFaceSearchReindex(updatedFace.getId(), correlationId);
        });
    }

    private void syncFaceSearchAsSuggested(MediaDetectedFace updatedFace, User suggestedUser, String correlationId) {
        String faceIdString = String.valueOf(updatedFace.getId());
        faceSearchReadModelRepository.findByFaceId(faceIdString).ifPresent(faceSearch -> {
            faceSearch.setIdentifiedUserId(suggestedUser.getUserId());
            faceSearch.setIdentifiedUsername(suggestedUser.getUsername());
            faceSearch.setMatchConfidence(updatedFace.getConfidenceScore());
            faceSearchReadModelRepository.save(faceSearch);
            publishFaceSearchReindex(updatedFace.getId(), correlationId);
        });
    }

    private void publishFaceSearchReindex(Long faceId, String correlationId) {
        java.util.Map<String, String> payload = new java.util.HashMap<>();
        payload.put("indexType", "face_search");
        payload.put("documentId", String.valueOf(faceId));
        payload.put("operation", "index");
        payload.put("correlationId", correlationId != null ? correlationId : "");
        payload.put("timestamp", java.time.Instant.now().toString());
        redisStreamPublisher.publish("es-sync-queue", payload);
    }

    private void syncMediaSearchDetectedUser(Long mediaId, User detectedUser) {
        mediaSearchReadModelRepository.findById(mediaId).ifPresent(mediaSearch -> {
            String userIdStr = String.valueOf(detectedUser.getUserId());
            String username = detectedUser.getUsername();

            List<String> idList = splitCsv(mediaSearch.getDetectedUserIds());
            if (idList.stream().noneMatch(v -> v.equals(userIdStr))) {
                idList = new java.util.ArrayList<>(idList);
                idList.add(userIdStr);
                mediaSearch.setDetectedUserIds(String.join(",", idList));
            }

            List<String> nameList = splitCsv(mediaSearch.getDetectedUsernames());
            if (nameList.stream().noneMatch(v -> v.equalsIgnoreCase(username))) {
                nameList = new java.util.ArrayList<>(nameList);
                nameList.add(username);
                mediaSearch.setDetectedUsernames(String.join(",", nameList));
            }

            mediaSearchReadModelRepository.save(mediaSearch);
            mediaSearchRepository.save(toMediaSearchDocument(mediaSearch));
        });
    }

    private MediaSearchDocument toMediaSearchDocument(
            com.kaleidoscope.backend.readmodels.model.MediaSearchReadModel media) {
        return MediaSearchDocument.builder()
                .id(String.valueOf(media.getMediaId()))
                .mediaId(media.getMediaId())
                .postId(media.getPostId())
                .mediaUrl(media.getMediaUrl())
                .aiCaption(media.getAiCaption())
                .aiTags(splitCsv(media.getAiTags()))
                .scenes(splitCsv(media.getAiScenes()))
                .detectedUserIds(splitCsv(media.getDetectedUserIds()))
                .detectedUsernames(splitCsv(media.getDetectedUsernames()))
                .isSafe(media.getIsSafe())
                .reactionCount(media.getReactionCount() != null ? media.getReactionCount().longValue() : 0L)
                .commentCount(media.getCommentCount() != null ? media.getCommentCount().longValue() : 0L)
                .createdAt(media.getCreatedAt() != null ? media.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDateTime() : null)
                .build();
    }

    private List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(v -> !v.isBlank())
                .toList();
    }

    private FaceRecognitionResultDTO convertMapRecordToDTO(MapRecord<String, String, String> record) {
        try {
            Map<String, String> values = record.getValue();
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

    private Long tryParseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void safeSleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}
