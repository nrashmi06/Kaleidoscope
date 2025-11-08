package com.kaleidoscope.backend.async.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.async.dto.MediaAiInsightsResultDTO;
import com.kaleidoscope.backend.async.exception.async.PostMediaNotFoundException;
import com.kaleidoscope.backend.async.exception.async.StreamDeserializationException;
import com.kaleidoscope.backend.async.exception.async.StreamMessageProcessingException;
import com.kaleidoscope.backend.async.service.ElasticsearchSyncTriggerService;
import com.kaleidoscope.backend.async.service.PostAggregationTriggerService;
import com.kaleidoscope.backend.async.service.PostProcessingStatusService;
import com.kaleidoscope.backend.async.service.ReadModelUpdateService;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.enums.MediaAiStatus;
import com.kaleidoscope.backend.posts.model.MediaAiInsights;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.posts.repository.MediaAiInsightsRepository;
import com.kaleidoscope.backend.posts.repository.PostMediaRepository;
import com.kaleidoscope.backend.posts.document.SearchAssetDocument;
import com.kaleidoscope.backend.posts.repository.search.SearchAssetSearchRepository;
import com.kaleidoscope.backend.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC; // <-- ADDED FOR CORRELATION ID
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component // Changed from @Service for injection into RedisStreamConfig
@RequiredArgsConstructor
@Slf4j
public class MediaAiInsightsConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final MediaAiInsightsRepository mediaAiInsightsRepository;
    private final PostMediaRepository postMediaRepository;
    private final SearchAssetSearchRepository searchAssetSearchRepository;
    private final ObjectMapper objectMapper;

    // --- ADDED FOR AI INTEGRATION (Task 6.1) ---
    private final ReadModelUpdateService readModelUpdateService;
    private final ElasticsearchSyncTriggerService elasticsearchSyncTriggerService;
    private final PostProcessingStatusService postProcessingStatusService;
    private final PostAggregationTriggerService postAggregationTriggerService;
    private final PostRepository postRepository; // Need this to get media IDs

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        // Retrieve the message ID for logging/XACK reference
        String messageId = record.getId().getValue();
        Map<String, String> value = record.getValue();
        String correlationId = value.get("correlationId");

        // Set correlationId in MDC for this thread
        try (var ignored = MDC.putCloseable("correlationId", correlationId)) {

            log.info("Received ML insights message from Redis Stream: streamKey={}, messageId={}",
                    record.getStream(), messageId);

            // Deserialization: Convert the incoming MapRecord message into MediaAiInsightsResultDTO
            MediaAiInsightsResultDTO resultDTO = convertMapRecordToDTO(record);
            log.info("Successfully deserialized ML insights for mediaId: {}", resultDTO.getMediaId());

            // Data Retrieval: Find the corresponding PostMedia entity
            PostMedia postMedia = postMediaRepository.findById(resultDTO.getMediaId())
                    .orElseThrow(() -> {
                        log.error("PostMedia not found for mediaId: {}", resultDTO.getMediaId());
                        return new PostMediaNotFoundException(resultDTO.getMediaId());
                    });
            log.info("Retrieved PostMedia for mediaId: {}, postId: {}", 
                    postMedia.getMediaId(), postMedia.getPost().getPostId());

            // PostgreSQL Update ("Write" Model): Create and save MediaAiInsights entity
            MediaAiInsights mediaAiInsights = createMediaAiInsightsEntity(resultDTO, postMedia);
            MediaAiInsights savedInsights = mediaAiInsightsRepository.save(mediaAiInsights);
            log.info("Saved MediaAiInsights for mediaId: {}, status: {}, isSafe: {}", 
                    savedInsights.getMediaId(), savedInsights.getStatus(), savedInsights.getIsSafe());

            // Elasticsearch Update ("Read" Model): Create and save SearchAssetDocument
            SearchAssetDocument searchDocument = createSearchAssetDocument(postMedia, savedInsights);
            SearchAssetDocument savedDocument = searchAssetSearchRepository.save(searchDocument);
            log.info("Saved SearchAssetDocument to Elasticsearch for mediaId: {}, documentId: {}", 
                    postMedia.getMediaId(), savedDocument.getId());


            // 1. Update the new 'read_model_media_search' table
            // This runs in a new transaction
            readModelUpdateService.updateMediaSearchReadModel(savedInsights, postMedia);

            // 2. Trigger ES Sync for the read model
            elasticsearchSyncTriggerService.triggerSync("read_model_media_search", postMedia.getMediaId());

            // 3. Check if all media for this post are processed
            Long postId = postMedia.getPost().getPostId();
            if (postProcessingStatusService.allMediaProcessedForPost(postId)) {
                log.info("All media for postId: {} have been processed. Triggering aggregation.", postId);

                // Get all media IDs for this post to send to the aggregator
                Post post = postRepository.findById(postId).orElseThrow(() ->
                    new IllegalStateException("Post not found for postId: " + postId) // Should not happen
                );
                List<Long> allMediaIds = post.getMedia().stream()
                                             .map(PostMedia::getMediaId)
                                             .collect(Collectors.toList());

                // 4. Trigger the Post Aggregation Service
                postAggregationTriggerService.triggerAggregation(postId, allMediaIds);
            } else {
                log.info("PostId: {} is still processing other media. Aggregation not triggered.", postId);
            }
            // --- END AI INTEGRATION ---

            log.info("Successfully processed ML insights for mediaId: {} and messageId: {}",
                    resultDTO.getMediaId(), messageId);

        } catch (PostMediaNotFoundException | StreamDeserializationException e) {
            log.error("Error processing ML insights message from Redis Stream: messageId={}, error={}. Message will remain in PEL.",
                    messageId, e.getMessage(), e);
            throw e; // Re-throw the exception to ensure transaction rollback and NO XACK
        } catch (Exception e) {
            log.error("Unexpected error processing ML insights message from Redis Stream: messageId={}, error={}. Message will remain in PEL.",
                    messageId, e.getMessage(), e);
            throw new StreamMessageProcessingException(record.getStream(), messageId,
                    "Unexpected error during ML insights processing", e); // Re-throw fatal exception
        }
        // MDC.clear() is handled automatically by the try-with-resources block
    }

    private MediaAiInsightsResultDTO convertMapRecordToDTO(MapRecord<String, String, String> record) {
        try {
            Map<String, String> recordValue = record.getValue();
            log.debug("Converting MapRecord to DTO with {} fields", recordValue.size());

            return MediaAiInsightsResultDTO.builder()
                    .mediaId(Long.parseLong(recordValue.get("mediaId")))
                    .isSafe(Boolean.parseBoolean(recordValue.get("isSafe")))
                    .caption(recordValue.get("caption"))
                    .tags(parseStringList(recordValue.get("tags")))
                    .scenes(parseStringList(recordValue.get("scenes")))
                    .imageEmbedding(recordValue.get("imageEmbedding"))
                    .build();
        } catch (Exception e) {
            log.error("Failed to convert MapRecord to MediaAiInsightsResultDTO: {}", e.getMessage(), e);
            throw new StreamDeserializationException(record.getStream(), record.getId().getValue(),
                    "Failed to deserialize ML insights message", e);
        }
    }

    private List<String> parseStringList(String value) {
        if (value == null || value.trim().isEmpty()) {
            return List.of();
        }
        // Handle JSON array format: ["tag1", "tag2"] or comma-separated: "tag1,tag2"
        if (value.startsWith("[") && value.endsWith("]")) {
            try {
                @SuppressWarnings("unchecked")
                List<String> stringList = objectMapper.readValue(value, List.class);
                return stringList;
            } catch (Exception e) {
                log.warn("Failed to parse JSON array, falling back to comma-separated parsing: {}", value);
            }
        }
        return Arrays.asList(value.split(","));
    }

    private MediaAiInsights createMediaAiInsightsEntity(MediaAiInsightsResultDTO resultDTO, PostMedia postMedia) {
        log.debug("Creating MediaAiInsights entity for mediaId: {}", resultDTO.getMediaId());

        return MediaAiInsights.builder()
                .mediaId(resultDTO.getMediaId())
                .postMedia(postMedia)
                .post(postMedia.getPost())
                .status(MediaAiStatus.COMPLETED)
                .isSafe(resultDTO.getIsSafe())
                .caption(resultDTO.getCaption())
                .tags(resultDTO.getTags() != null ? resultDTO.getTags().toArray(new String[0]) : new String[0])
                .scenes(resultDTO.getScenes() != null ? resultDTO.getScenes().toArray(new String[0]) : new String[0])
                .imageEmbedding(resultDTO.getImageEmbedding())
                .build();
    }

    private SearchAssetDocument createSearchAssetDocument(PostMedia postMedia, MediaAiInsights insights) {
        log.debug("Creating SearchAssetDocument for mediaId: {}", postMedia.getMediaId());

        Post post = postMedia.getPost();
        User user = post.getUser();

        // Create denormalized uploaderInfo
        Map<String, Object> uploaderInfo = new HashMap<>();
        uploaderInfo.put("userId", user.getUserId());
        uploaderInfo.put("username", user.getUsername());
        uploaderInfo.put("profilePictureUrl", user.getProfilePictureUrl());

        // Create denormalized postInfo
        Map<String, Object> postInfo = new HashMap<>();
        postInfo.put("postId", post.getPostId());
        postInfo.put("title", post.getTitle());
        postInfo.put("body", post.getBody());
        postInfo.put("summary", post.getSummary());
        postInfo.put("visibility", post.getVisibility().toString());
        postInfo.put("status", post.getStatus().toString());
        postInfo.put("createdAt", post.getCreatedAt());

        // Initialize empty detectedUsers map (will be populated by face recognition pipeline)
        Map<String, Object> detectedUsers = new HashMap<>();

        return SearchAssetDocument.builder()
                .id(postMedia.getMediaId().toString()) // Use mediaId as Elasticsearch document ID
                .mediaId(postMedia.getMediaId())
                .postId(post.getPostId())
                .mediaUrl(postMedia.getMediaUrl())
                .uploaderInfo(uploaderInfo)
                .postInfo(postInfo)
                .caption(insights.getCaption())
                .tags(insights.getTags() != null ? Arrays.asList(insights.getTags()) : List.of())
                .scenes(insights.getScenes() != null ? Arrays.asList(insights.getScenes()) : List.of())
                .imageEmbedding(insights.getImageEmbedding())
                .detectedUsers(detectedUsers) // Initialize empty - populated by face pipeline
                .reactionCount(0) // Initialize to 0 - updated by separate reaction events
                .commentCount(0) // Initialize to 0 - updated by separate comment events
                .createdAt(post.getCreatedAt().atOffset(java.time.ZoneOffset.UTC))
                .lastUpdated(java.time.OffsetDateTime.now())
                .build();
    }
}
