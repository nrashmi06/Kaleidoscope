package com.kaleidoscope.backend.async.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.async.dto.FaceDetectionResultDTO;
import com.kaleidoscope.backend.async.exception.async.BboxParsingException;
import com.kaleidoscope.backend.async.exception.async.StreamDeserializationException;
import com.kaleidoscope.backend.async.exception.async.StreamMessageProcessingException;
import com.kaleidoscope.backend.async.service.ElasticsearchSyncTriggerService;
import com.kaleidoscope.backend.async.service.PostAggregationTriggerService;
import com.kaleidoscope.backend.async.service.PostProcessingStatusService;
import com.kaleidoscope.backend.async.service.ReadModelUpdateService;
import com.kaleidoscope.backend.posts.document.MediaSearchDocument;
import com.kaleidoscope.backend.posts.enums.FaceDetectionStatus;
import com.kaleidoscope.backend.posts.enums.MediaAiStatus;
import com.kaleidoscope.backend.posts.model.MediaAiInsights;
import com.kaleidoscope.backend.posts.model.MediaDetectedFace;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.posts.repository.MediaAiInsightsRepository;
import com.kaleidoscope.backend.posts.repository.MediaDetectedFaceRepository;
import com.kaleidoscope.backend.posts.repository.PostMediaRepository;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.repository.search.MediaSearchRepository;
import com.kaleidoscope.backend.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component // Changed from @Service for injection into RedisStreamConfig
@RequiredArgsConstructor
@Slf4j
public class FaceDetectionConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final ObjectMapper objectMapper;
    private final MediaDetectedFaceRepository mediaDetectedFaceRepository;
    private final MediaAiInsightsRepository mediaAiInsightsRepository;
    private final ReadModelUpdateService readModelUpdateService;
    private final ElasticsearchSyncTriggerService elasticsearchSyncTriggerService;
    private final JdbcTemplate jdbcTemplate;
    private final PostMediaRepository postMediaRepository;
    private final TransactionTemplate transactionTemplate;
    private final PostProcessingStatusService postProcessingStatusService;
    private final PostAggregationTriggerService postAggregationTriggerService;
    private final PostRepository postRepository;
    private final MediaSearchRepository mediaSearchRepository;

    // --- ADDED FOR RETRY LOGIC ---
    private static final int MAX_RETRY_ATTEMPTS = 5;
    private static final long INITIAL_RETRY_DELAY_MS = 100;

    @Override
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

            MediaAiInsights mediaAiInsights = findOrCreateMediaAiInsights(resultDTO.getMediaId());
            if (mediaAiInsights == null) {
                // If it still returns null, the post media itself likely doesn't exist anymore.
                log.warn("Could not find or create MediaAiInsights for mediaId: {}. Acknowledging face detection message.",
                        resultDTO.getMediaId());
                return;
            }

            // 1. Persist detected faces in one transaction
            transactionTemplate.executeWithoutResult(status -> {
                log.info("Processing {} faces for mediaId: {}", faces.size(), resultDTO.getMediaId());

                List<MediaDetectedFace> existingFaces = mediaDetectedFaceRepository.findByMediaAiInsights_MediaId(resultDTO.getMediaId());

                for (FaceDetectionResultDTO.FaceDetails face : faces) {
                    // Deduplicate based on bbox
                    Integer[] bboxArray = face.getBbox() != null
                            ? face.getBbox().stream()
                                    .map(v -> v != null ? v.intValue() : null)
                                    .toArray(Integer[]::new)
                            : new Integer[0];
                    String bboxArrayStr = arrayToString(bboxArray);
                    
                    boolean alreadyExists = existingFaces.stream()
                        .anyMatch(existing -> arrayToString(existing.getBbox()).equals(bboxArrayStr));
                        
                    if (alreadyExists) {
                        log.debug("Face already exists for mediaId={}, bbox={}, skipping due to idempotency", resultDTO.getMediaId(), bboxArrayStr);
                        continue;
                    }

                    MediaDetectedFace savedFace = saveFaceWithVectorEmbedding(face, mediaAiInsights);
                    readModelUpdateService.createFaceSearchReadModel(savedFace);
                    elasticsearchSyncTriggerService.triggerSync("read_model_face_search", savedFace.getId());
                    log.info("Saved MediaDetectedFace for mediaId: {}, faceId: {}, status: {}",
                            resultDTO.getMediaId(), savedFace.getId(), savedFace.getStatus());
                }
            });

            // 2. Mark service completion in a separate transaction with retries on optimistic lock conflicts.
            appendServiceCompletedWithRetry(resultDTO.getMediaId(), "face_detection");

            // 3. Refresh the media_search document so detectedFaceCount is accurate
            refreshMediaSearchDocument(resultDTO.getMediaId());

            // 4. Check if all media for this post are processed (including faces) and trigger aggregation
            if (mediaAiInsights != null && mediaAiInsights.getPost() != null) {
                checkAndTriggerAggregation(mediaAiInsights.getPost().getPostId());
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
     * Appends a service name to the services_completed array with retry logic for optimistic lock conflicts.
     * Uses a separate transaction to ensure completion status doesn't block main face persistence.
     */
    private void appendServiceCompletedWithRetry(Long mediaId, String serviceName) {
        long currentDelay = INITIAL_RETRY_DELAY_MS;
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                transactionTemplate.executeWithoutResult(status -> {
                    MediaAiInsights insights = mediaAiInsightsRepository.findByMediaId(mediaId)
                            .orElseThrow(() -> new RuntimeException("MediaAiInsights disappeared during retry"));
                    
                    String[] current = insights.getServicesCompleted();
                    if (current == null) {
                        insights.setServicesCompleted(new String[] { serviceName });
                    } else if (Arrays.stream(current).noneMatch(serviceName::equals)) {
                        String[] updated = Arrays.copyOf(current, current.length + 1);
                        updated[current.length] = serviceName;
                        insights.setServicesCompleted(updated);
                    } else {
                        return; // Already completed, nothing to do
                    }
                    mediaAiInsightsRepository.save(insights);
                });
                return; // Success, exit retry loop
            } catch (Exception e) {
                if (attempt == MAX_RETRY_ATTEMPTS) {
                    log.error("Failed to append service completed '{}' for mediaId: {} after {} attempts", 
                            serviceName, mediaId, MAX_RETRY_ATTEMPTS, e);
                    throw e;
                }
                
                log.warn("Optimistic lock conflict or error appending service completed for mediaId: {}. Retrying in {}ms (Attempt {}/{})",
                        mediaId, currentDelay, attempt, MAX_RETRY_ATTEMPTS);
                
                try {
                    Thread.sleep(currentDelay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Retry interrupted", ie);
                }
                currentDelay *= 2; // Exponential backoff
            }
        }
    }

    /**
     * Tries to find the MediaAiInsights record or creates a placeholder if it doesn't exist.
     * Uses exponential backoff for optimistic lock retries.
     */
    private MediaAiInsights findOrCreateMediaAiInsights(Long mediaId) {
        long currentDelay = INITIAL_RETRY_DELAY_MS;
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                return transactionTemplate.execute(status -> {
                    Optional<MediaAiInsights> insights = mediaAiInsightsRepository.findByMediaId(mediaId);
                    if (insights.isPresent()) {
                        return insights.get();
                    }

                    PostMedia managedMedia = postMediaRepository.findById(mediaId).orElse(null);
                    if (managedMedia == null) {
                        return null;
                    }

                    MediaAiInsights newInsights = MediaAiInsights.builder()
                            .postMedia(managedMedia)
                            .post(managedMedia.getPost())
                            .status(MediaAiStatus.PROCESSING)
                            .servicesCompleted(new String[0])
                            .build();

                    return mediaAiInsightsRepository.save(newInsights);
                });
            } catch (Exception e) {
                if (attempt == MAX_RETRY_ATTEMPTS) {
                    log.error("Failed to find or create MediaAiInsights for mediaId: {} after {} attempts", mediaId, MAX_RETRY_ATTEMPTS, e);
                    throw e;
                }
                log.warn("Optimistic lock conflict or error creating insights for mediaId: {}. Retrying in {}ms (Attempt {}/{})",
                        mediaId, currentDelay, attempt, MAX_RETRY_ATTEMPTS);
                try {
                    Thread.sleep(currentDelay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new StreamMessageProcessingException("face-detection",
                            String.valueOf(mediaId), "Retry interrupted", e);
                }
                currentDelay *= 2;
            }
        }
        return null; // Should not reach here
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

    /**
     * NEW METHOD: Saves face with vector embedding using native SQL
     * This is required because Hibernate doesn't natively support PostgreSQL vector types
     */
    private MediaDetectedFace saveFaceWithVectorEmbedding(
            FaceDetectionResultDTO.FaceDetails face, MediaAiInsights mediaAiInsights) {

        // Convert bbox to PostgreSQL array format
        Integer[] bboxArray = face.getBbox() != null
                ? face.getBbox().stream()
                        .map(value -> value != null ? value.intValue() : null)
                        .toArray(Integer[]::new)
                : new Integer[0];
        String bboxArrayStr = arrayToString(bboxArray);

        // Convert embedding to PostgreSQL vector format: [0.0,0.0,0.0,...]
        String embeddingVector = formatEmbeddingForVector(face.getEmbedding());
        if (embeddingVector == null) {
            log.debug("No face embedding present for mediaId={}, incoming faceId={}. Persisting bbox/confidence only.",
                mediaAiInsights.getMediaId(), face.getFaceId());
        }

        Float confidenceScore = face.getConfidence() != null ? face.getConfidence().floatValue() : null;

        // Use native SQL with CAST to insert vector properly
        String insertSql = """
            INSERT INTO media_detected_faces 
            (media_id, bbox, confidence_score, embedding, identified_user_id, suggested_user_id, status)
            VALUES (?, ?::integer[], ?, ?::vector, ?, ?, ?)
            RETURNING id
            """;

        try {
            Long faceId = jdbcTemplate.queryForObject(insertSql, Long.class,
                mediaAiInsights.getMediaId(),
                bboxArrayStr,
                confidenceScore,
                embeddingVector,
                null, // identified_user_id
                null, // suggested_user_id
                FaceDetectionStatus.UNIDENTIFIED.name()
            );

            // Reload the entity to get all fields
            MediaDetectedFace savedFace = mediaDetectedFaceRepository.findById(faceId)
                .orElseThrow(() -> new RuntimeException("Failed to retrieve saved face with id: " + faceId));

            log.debug("Successfully saved MediaDetectedFace with id: {} for mediaId: {}",
                     faceId, mediaAiInsights.getMediaId());

            return savedFace;

        } catch (Exception e) {
            log.error("Failed to save MediaDetectedFace for mediaId: {}, faceId: {}",
                     mediaAiInsights.getMediaId(), face.getFaceId(), e);
            throw new StreamMessageProcessingException("face-detection",
                    face.getFaceId(), "Failed to save face with vector embedding", e);
        }
    }

    /**
     * Helper: Formats List<Double> embedding to PostgreSQL vector array format
     * Format: [0.0,0.0,0.0,...] (plain array string, not JSON)
     */
    private String formatEmbeddingForVector(List<Double> embedding) {
        if (embedding == null || embedding.isEmpty()) {
            return null;
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(embedding.get(i));
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Helper: Converts Integer[] to PostgreSQL array string format
     * Format: {1,2,3} for integer arrays
     */
    private String arrayToString(Integer[] array) {
        if (array == null || array.length == 0) {
            return "{}";
        }
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(array[i]);
        }
        sb.append("}");
        return sb.toString();
    }

    private void checkAndTriggerAggregation(Long postId) {
        if (postProcessingStatusService.allMediaProcessedForPost(postId)) {
            log.info("All media for postId: {} have been processed. Triggering aggregation.", postId);
            // Use the direct repository query to avoid LazyInitializationException on Post.media
            List<Long> allMediaIds = postMediaRepository.findMediaIdsByPostId(postId);
            if (!allMediaIds.isEmpty()) {
                postAggregationTriggerService.triggerAggregation(postId, allMediaIds);
            } else {
                log.warn("Aggregation triggered for postId: {} but no media IDs found!", postId);
            }
        } else {
            log.info("PostId: {} is still processing other media. Aggregation not triggered.", postId);
        }
    }

    private void refreshMediaSearchDocument(Long mediaId) {
        try {
            transactionTemplate.executeWithoutResult(status -> {
                Optional<MediaAiInsights> insightsOpt = mediaAiInsightsRepository.findByMediaId(mediaId);
                if (insightsOpt.isPresent()) {
                    MediaAiInsights insights = insightsOpt.get();
                    MediaSearchDocument doc = toMediaSearchDocument(insights.getPostMedia(), insights);
                    mediaSearchRepository.save(doc);
                    log.debug("Refreshed media_search document for mediaId: {}", mediaId);
                }
            });
        } catch (Exception e) {
            log.warn("Failed to refresh media_search document for mediaId: {}: {}", mediaId, e.getMessage());
        }
    }

    private MediaSearchDocument toMediaSearchDocument(PostMedia postMedia, MediaAiInsights insights) {
        Post post = postMedia.getPost();
        User uploader = post.getUser();

        MediaSearchDocument.PostInfo postInfo = MediaSearchDocument.PostInfo.builder()
                .title(post.getTitle())
                .visibility(post.getVisibility() != null ? post.getVisibility().name() : null)
                .categories(post.getCategories() != null
                        ? post.getCategories().stream()
                                .filter(pc -> pc != null && pc.getCategory() != null && pc.getCategory().getName() != null)
                                .map(pc -> pc.getCategory().getName())
                                .collect(Collectors.toList())
                        : List.of())
                .build();

        MediaSearchDocument.UploaderInfo uploaderInfo = MediaSearchDocument.UploaderInfo.builder()
                .userId(uploader.getUserId())
                .username(uploader.getUsername())
                .build();

        return MediaSearchDocument.builder()
                .id(String.valueOf(postMedia.getMediaId()))
                .mediaId(postMedia.getMediaId())
                .postId(post.getPostId())
                .mediaUrl(postMedia.getMediaUrl())
                .mediaType(postMedia.getMediaType() != null ? postMedia.getMediaType().name() : null)
                .aiStatus(insights.getStatus() != null ? insights.getStatus().name() : null)
                .isSafe(insights.getIsSafe())
                .aiCaption(insights.getCaption())
                .aiTags(insights.getTags() != null ? Arrays.asList(insights.getTags()) : List.of())
                .scenes(insights.getScenes() != null ? Arrays.asList(insights.getScenes()) : List.of())
                .detectedFaceCount(mediaDetectedFaceRepository.findByMediaAiInsights_MediaId(postMedia.getMediaId()).size())
                .postInfo(postInfo)
                .uploaderInfo(uploaderInfo)
                .reactionCount(0L)
                .commentCount(0L)
                .createdAt(post.getCreatedAt())
                .build();
    }
}

