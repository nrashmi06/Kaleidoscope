package com.kaleidoscope.backend.async.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.async.dto.FaceDetectionResultDTO;
import com.kaleidoscope.backend.async.exception.async.BboxParsingException;
import com.kaleidoscope.backend.async.exception.async.StreamDeserializationException;
import com.kaleidoscope.backend.async.exception.async.StreamMessageProcessingException;
import com.kaleidoscope.backend.async.service.ElasticsearchSyncTriggerService;
import com.kaleidoscope.backend.async.service.ReadModelUpdateService;
import com.kaleidoscope.backend.posts.enums.FaceDetectionStatus;
import com.kaleidoscope.backend.posts.model.MediaAiInsights;
import com.kaleidoscope.backend.posts.model.MediaDetectedFace;
import com.kaleidoscope.backend.posts.repository.MediaAiInsightsRepository;
import com.kaleidoscope.backend.posts.repository.MediaDetectedFaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component // Changed from @Service for injection into RedisStreamConfig
@RequiredArgsConstructor
@Slf4j
public class FaceDetectionConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final ObjectMapper objectMapper;
    private final MediaDetectedFaceRepository mediaDetectedFaceRepository;
    private final MediaAiInsightsRepository mediaAiInsightsRepository;
    private final ReadModelUpdateService readModelUpdateService;
    private final ElasticsearchSyncTriggerService elasticsearchSyncTriggerService;

    // --- ADDED FOR RETRY LOGIC ---
    private static final int MAX_RETRY_ATTEMPTS = 5;
    private static final long INITIAL_RETRY_DELAY_MS = 100;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        String messageId = record.getId().getValue();
        Map<String, String> value = record.getValue();
        String correlationId = value.get("correlationId");

        try (var ignored = MDC.putCloseable("correlationId", correlationId)) {
            log.info("Received face detection message from Redis Stream: streamKey={}, messageId={}",
                    record.getStream(), messageId);

            FaceDetectionResultDTO resultDTO = convertMapRecordToDTO(record);
            List<FaceDetectionResultDTO.FaceDetails> faces = resultDTO.getFaces();
            int detectedCount = resultDTO.getFacesDetected() != null
                    ? resultDTO.getFacesDetected()
                    : (faces != null ? faces.size() : 0);

            if (detectedCount == 0 || faces == null || faces.isEmpty()) {
                log.info("No faces detected for mediaId: {} - acknowledging message", resultDTO.getMediaId());
                return;
            }

            MediaAiInsights mediaAiInsights = findMediaAiInsightsWithRetry(resultDTO.getMediaId());
            if (mediaAiInsights == null) {
                log.warn("MediaAiInsights not found for mediaId: {} after retries. Acknowledging message.",
                         resultDTO.getMediaId());
                return;
            }

            log.info("Processing {} faces for mediaId: {}", faces.size(), mediaAiInsights.getMediaId());

            for (FaceDetectionResultDTO.FaceDetails face : faces) {
                MediaDetectedFace detectedFace = createMediaDetectedFaceEntity(face, mediaAiInsights);
                MediaDetectedFace savedFace = mediaDetectedFaceRepository.save(detectedFace);
                readModelUpdateService.createFaceSearchReadModel(savedFace);
                elasticsearchSyncTriggerService.triggerSync("read_model_face_search", savedFace.getId());
                log.info("Saved MediaDetectedFace for mediaId: {}, faceId: {}, status: {}",
                        mediaAiInsights.getMediaId(), savedFace.getId(), savedFace.getStatus());
            }

            log.info("Successfully processed face detection for mediaId: {} and messageId: {}",
                    resultDTO.getMediaId(), messageId);

        } catch (StreamDeserializationException | BboxParsingException e) {
            log.error("Error processing face detection message from Redis Stream: messageId={}, error={}. Message will remain in PEL.",
                    messageId, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error processing face detection message from Redis Stream: messageId={}, error={}. Message will remain in PEL.",
                    messageId, e.getMessage(), e);
            throw new StreamMessageProcessingException(record.getStream(), messageId,
                    "Unexpected error during face detection processing", e);
        }
    }

    /**
     * --- UPDATED METHOD ---
     * Tries to find the MediaAiInsights record with exponential backoff.
     * Uses findByMediaId instead of findById to be explicit about the lookup.
     * This handles the race condition where this consumer runs before MediaAiInsightsConsumer.
     * Returns null if the MediaAiInsights is not found after all retries (post was deleted).
     */
    private MediaAiInsights findMediaAiInsightsWithRetry(Long mediaId) {
        long currentDelay = INITIAL_RETRY_DELAY_MS;
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            Optional<MediaAiInsights> insights = mediaAiInsightsRepository.findByMediaId(mediaId);
            if (insights.isPresent()) {
                if (attempt > 1) {
                    log.info("Found MediaAiInsights for mediaId: {} on attempt {}", mediaId, attempt);
                }
                return insights.get();
            }

            if (attempt < MAX_RETRY_ATTEMPTS) {
                log.warn("MediaAiInsights not found for mediaId: {}. Retrying in {}ms (Attempt {}/{})",
                        mediaId, currentDelay, attempt, MAX_RETRY_ATTEMPTS);
                try {
                    Thread.sleep(currentDelay);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt(); // Restore interrupted status
                    log.error("Retry interrupted for mediaId: {}", mediaId, e);
                    throw new StreamMessageProcessingException("face-detection",
                            String.valueOf(mediaId), "Retry interrupted", e);
                }
                currentDelay *= 2; // Exponential backoff
            }
        }

        log.warn("MediaAiInsights not found for mediaId: {} after {} attempts. The post/media may have been deleted. Returning null to acknowledge message.",
                mediaId, MAX_RETRY_ATTEMPTS);
        return null; // Return null instead of throwing exception
    }

    private FaceDetectionResultDTO convertMapRecordToDTO(MapRecord<String, String, String> record) {
        try {
            Map<String, String> recordValue = record.getValue();

            log.debug("Converting face detection MapRecord to DTO. Keys: {}", recordValue.keySet());

            // Parse faces field - it should be a JSON string in Redis
            List<FaceDetectionResultDTO.FaceDetails> faces = List.of();
            String facesStr = recordValue.get("faces");

            if (facesStr != null && !facesStr.trim().isEmpty()) {
                try {
                    // Log the raw value for debugging
                    log.debug("Parsing faces JSON string. Length: {}, Preview: {}",
                             facesStr.length(),
                             facesStr.length() > 100 ? facesStr.substring(0, 100) + "..." : facesStr);

                    faces = objectMapper.readValue(
                            facesStr,
                            new TypeReference<List<FaceDetectionResultDTO.FaceDetails>>() {});

                    log.debug("Successfully parsed {} faces", faces.size());
                } catch (Exception e) {
                    log.error("Failed to parse faces JSON string. Value: {}, Error: {}",
                             facesStr.length() > 200 ? facesStr.substring(0, 200) + "..." : facesStr,
                             e.getMessage(), e);
                    throw new StreamDeserializationException(
                            record.getStream(),
                            record.getId().getValue(),
                            "Failed to deserialize faces JSON: " + e.getMessage(),
                            e);
                }
            } else {
                log.warn("Faces field is null or empty in Redis stream message");
            }

            Long mediaId = Long.parseLong(recordValue.get("mediaId"));
            Long postId = recordValue.get("postId") != null ? Long.parseLong(recordValue.get("postId")) : null;

            Integer facesDetected = recordValue.get("facesDetected") != null
                    ? Integer.parseInt(recordValue.get("facesDetected"))
                    : faces.size();

            return FaceDetectionResultDTO.builder()
                    .mediaId(mediaId)
                    .postId(postId)
                    .facesDetected(facesDetected)
                    .faces(faces)
                    .build();
        } catch (StreamDeserializationException e) {
            throw e; // Re-throw deserialization exceptions
        } catch (Exception e) {
            log.error("Failed to convert MapRecord to FaceDetectionResultDTO: {}", e.getMessage(), e);
            throw new StreamDeserializationException(record.getStream(), record.getId().getValue(),
                    "Failed to deserialize face detection message", e);
        }
    }

    private MediaDetectedFace createMediaDetectedFaceEntity(
            FaceDetectionResultDTO.FaceDetails face, MediaAiInsights mediaAiInsights) {

        Integer[] bboxArray = face.getBbox() != null
                ? face.getBbox().stream()
                        .map(value -> value != null ? value.intValue() : null)
                        .toArray(Integer[]::new)
                : new Integer[0];

        // Convert List<Double> embedding to PostgreSQL vector array format
        // PostgreSQL pgvector expects format: [0.0,0.0,0.0,...] (plain array string, not JSON)
        String embeddingVector = null;
        if (face.getEmbedding() != null && !face.getEmbedding().isEmpty()) {
            try {
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < face.getEmbedding().size(); i++) {
                    if (i > 0) sb.append(",");
                    sb.append(face.getEmbedding().get(i));
                }
                sb.append("]");
                embeddingVector = sb.toString();
                log.debug("Converted embedding to PostgreSQL vector format: length={}", face.getEmbedding().size());
            } catch (Exception e) {
                log.error("Failed to convert embedding to PostgreSQL vector format for faceId: {}", face.getFaceId(), e);
                throw new StreamMessageProcessingException("face-detection",
                        face.getFaceId(), "Failed to serialize embedding to vector format", e);
            }
        }

        return MediaDetectedFace.builder()
                .mediaAiInsights(mediaAiInsights)
                .bbox(bboxArray)
                .embedding(embeddingVector)  // PostgreSQL vector format: [0.0,0.0,0.0,...]
                .confidenceScore(face.getConfidence() != null ? face.getConfidence().floatValue() : null)
                .status(FaceDetectionStatus.UNIDENTIFIED)
                .build();
    }
}
