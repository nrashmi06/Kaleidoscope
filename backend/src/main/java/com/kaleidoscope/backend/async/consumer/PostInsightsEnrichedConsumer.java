package com.kaleidoscope.backend.async.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.async.dto.PostInsightsEnrichedDTO;
import com.kaleidoscope.backend.async.exception.async.StreamDeserializationException;
import com.kaleidoscope.backend.async.service.ElasticsearchSyncTriggerService;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.readmodels.model.MediaSearchReadModel;
import com.kaleidoscope.backend.readmodels.model.PostSearchReadModel;
import com.kaleidoscope.backend.readmodels.repository.MediaSearchReadModelRepository;
import com.kaleidoscope.backend.readmodels.repository.PostSearchReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Consumes aggregated insights for an entire post *after* all media have been processed.
 * Updates the 'read_model_post_search' table and back-fills 'read_model_media_search'.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PostInsightsEnrichedConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final ObjectMapper objectMapper;
    private final PostSearchReadModelRepository postSearchReadModelRepository;
    private final MediaSearchReadModelRepository mediaSearchReadModelRepository;
    private final ElasticsearchSyncTriggerService elasticsearchSyncTriggerService;
    private final PostRepository postRepository;  // ADDED: To fetch Post entity for author info

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        String messageId = record.getId().getValue();
        Map<String, String> value = record.getValue();
        String correlationId = value.get("correlationId");

        // Set correlationId in MDC for this thread
        try (var ignored = MDC.putCloseable("correlationId", correlationId)) {

            log.info("Received post-insights-enriched message from Redis Stream: messageId={}", messageId);

            // Deserialize the event
            PostInsightsEnrichedDTO enriched = convertMapRecordToDTO(record);

            Long postId = enriched.getPostId();
            if (postId == null) {
                log.warn("PostInsightsEnriched message has null postId. Skipping. messageId={}", messageId);
                return;
            }

            // 1. Update Post Search Read Model
            Optional<PostSearchReadModel> existingOpt = postSearchReadModelRepository.findById(postId);
            PostSearchReadModel postSearch = existingOpt.orElse(new PostSearchReadModel());
            boolean isNew = existingOpt.isEmpty();

            // If creating a new record, fetch Post entity to populate required author fields
            if (isNew) {
                Optional<Post> postOpt = postRepository.findById(postId);
                if (postOpt.isPresent()) {
                    Post post = postOpt.get();
                    postSearch.setPostId(postId);
                    postSearch.setAuthorId(post.getUser().getUserId());
                    postSearch.setAuthorUsername(post.getUser().getUsername());
                    postSearch.setAuthorDepartment(post.getUser().getDesignation());
                    postSearch.setTitle(post.getTitle());
                    postSearch.setBody(post.getBody());
                    postSearch.setCreatedAt(post.getCreatedAt() != null ? post.getCreatedAt().toInstant(java.time.ZoneOffset.UTC) : Instant.now());
                    log.debug("Populated author info for new PostSearchReadModel: postId={}, authorId={}, authorUsername={}",
                            postId, post.getUser().getUserId(), post.getUser().getUsername());
                } else {
                    log.warn("Post not found for postId: {}. Cannot populate author fields. Skipping.", postId);
                    return;
                }
            } else {
                // For existing records, just set postId if not already set
                postSearch.setPostId(postId);
            }

            // Update AI aggregated fields
            if(enriched.getAllAiTags() != null) {
                postSearch.setAllAiTags(String.join(",", enriched.getAllAiTags()));
            }
            if(enriched.getAllAiScenes() != null) {
                postSearch.setAllAiScenes(String.join(",", enriched.getAllAiScenes()));
            }
            postSearch.setInferredEventType(enriched.getInferredEventType());
            postSearch.setUpdatedAt(Instant.now());

            postSearchReadModelRepository.save(postSearch);
            log.info("Updated read_model_post_search for postId: {}", postId);

            // 2. Back-fill 'post_all_tags' in all related Media Search Read Models
            // (Using the efficient findByPostId method)
            List<MediaSearchReadModel> mediaModels = mediaSearchReadModelRepository.findByPostId(postId);

            if (!mediaModels.isEmpty() && enriched.getAllAiTags() != null) {
                String allTags = String.join(",", enriched.getAllAiTags());
                for (MediaSearchReadModel media : mediaModels) {
                    media.setPostAllTags(allTags);
                }
                mediaSearchReadModelRepository.saveAll(mediaModels);
                log.info("Back-filled post_all_tags for {} media items in postId: {}", mediaModels.size(), postId);
            }

            // 3. Trigger ES sync for the post
            elasticsearchSyncTriggerService.triggerSync("read_model_post_search", postId);

            // 4. Trigger ES sync for all associated media (as they were updated)
            for (MediaSearchReadModel media : mediaModels) {
                elasticsearchSyncTriggerService.triggerSync("read_model_media_search", media.getMediaId());
            }

            log.info("Successfully processed post-insights-enriched message for postId: {}, messageId: {}",
                    enriched.getPostId(), messageId);

        } catch (StreamDeserializationException e) {
            log.error("Error deserializing post-insights-enriched message: messageId={}, error={}. Message will remain in PEL.",
                    messageId, e.getMessage(), e);
            throw e; // Re-throw specific exception to prevent XACK
        } catch (Exception e) {
            log.error("Error processing post-insights-enriched message: messageId={}, error={}. Message will remain in PEL.",
                    messageId, e.getMessage(), e);
            throw e; // Re-throw to prevent XACK on failure
        }
        // MDC.clear() is handled automatically by the try-with-resources block
    }

    /**
     * Manually converts the MapRecord to the DTO, handling JSON string deserialization for list fields.
     */
    private PostInsightsEnrichedDTO convertMapRecordToDTO(MapRecord<String, String, String> record) {
        Map<String, String> value = record.getValue();
        String streamName = record.getStream();
        String messageId = record.getId().getValue();

        try {
            PostInsightsEnrichedDTO.PostInsightsEnrichedDTOBuilder builder = PostInsightsEnrichedDTO.builder();

            builder.postId(Long.parseLong(value.get("postId")));
            builder.inferredEventType(value.get("inferredEventType"));
            builder.timestamp(value.get("timestamp"));
            builder.correlationId(value.get("correlationId"));

            // Manually parse List<String> fields from their JSON string representation
            TypeReference<List<String>> listTypeRef = new TypeReference<>() {};

            String allAiTagsStr = value.get("allAiTags");
            if (allAiTagsStr != null && !allAiTagsStr.isEmpty() && !allAiTagsStr.equals("null")) {
                builder.allAiTags(objectMapper.readValue(allAiTagsStr, listTypeRef));
            } else {
                builder.allAiTags(Collections.emptyList());
            }

            String allAiScenesStr = value.get("allAiScenes");
            if (allAiScenesStr != null && !allAiScenesStr.isEmpty() && !allAiScenesStr.equals("null")) {
                builder.allAiScenes(objectMapper.readValue(allAiScenesStr, listTypeRef));
            } else {
                builder.allAiScenes(Collections.emptyList());
            }

            return builder.build();

        } catch (Exception e) {
            log.error("Failed to convert MapRecord to PostInsightsEnrichedDTO: {}", e.getMessage(), e);
            throw new StreamDeserializationException(streamName, messageId,
                    "Failed to deserialize post-insights-enriched message", e);
        }
    }
}