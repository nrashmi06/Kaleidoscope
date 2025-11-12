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
     * --- NEW METHOD ---
     * Tries to find the MediaAiInsights record with exponential backoff.
     * This handles the race condition where this consumer runs before MediaAiInsightsConsumer.
     * Returns null if the MediaAiInsights is not found after all retries (post was deleted).
     */
    private MediaAiInsights findMediaAiInsightsWithRetry(Long mediaId) {
        long currentDelay = INITIAL_RETRY_DELAY_MS;
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            Optional<MediaAiInsights> insights = mediaAiInsightsRepository.findById(mediaId);
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

            List<FaceDetectionResultDTO.FaceDetails> faces = recordValue.get("faces") != null
                    ? objectMapper.readValue(
                            recordValue.get("faces"),
                            new TypeReference<List<FaceDetectionResultDTO.FaceDetails>>() {})
                    : List.of();

            return FaceDetectionResultDTO.builder()
                    .mediaId(Long.parseLong(recordValue.get("mediaId")))
                    .postId(recordValue.get("postId") != null ? Long.parseLong(recordValue.get("postId")) : null)
                    .facesDetected(recordValue.get("facesDetected") != null
                            ? Integer.parseInt(recordValue.get("facesDetected"))
                            : faces.size())
                    .faces(faces)
                    .build();
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

        return MediaDetectedFace.builder()
                .mediaAiInsights(mediaAiInsights)
                .bbox(bboxArray)
                .embedding(face.getEmbedding())
                .confidenceScore(face.getConfidence() != null ? face.getConfidence().floatValue() : null)
                .status(FaceDetectionStatus.UNIDENTIFIED)
                .build();
    }
}
