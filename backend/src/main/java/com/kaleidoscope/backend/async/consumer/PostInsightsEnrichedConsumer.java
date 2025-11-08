package com.kaleidoscope.backend.async.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.async.dto.PostInsightsEnrichedDTO;
import com.kaleidoscope.backend.async.service.ElasticsearchSyncTriggerService;
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
import java.util.List;
import java.util.Map;

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
            PostInsightsEnrichedDTO enriched = objectMapper.convertValue(value, PostInsightsEnrichedDTO.class);

            Long postId = enriched.getPostId();
            if (postId == null) {
                log.warn("PostInsightsEnriched message has null postId. Skipping. messageId={}", messageId);
                return;
            }

            // 1. Update Post Search Read Model
            PostSearchReadModel postSearch = postSearchReadModelRepository.findById(postId)
                    .orElse(new PostSearchReadModel()); // Create if not exists

            // We assume other services (like a future PostUpdate consumer) populate author, title, etc.
            // This consumer adds the aggregated AI data.
            postSearch.setPostId(postId);
            
            if(enriched.getAllAiTags() != null) {
                postSearch.setAllAiTags(String.join(",", enriched.getAllAiTags()));
            }
            if(enriched.getAllAiScenes() != null) {
                postSearch.setAllAiScenes(String.join(",", enriched.getAllAiScenes()));
            }
            postSearch.setInferredEventType(enriched.getInferredEventType());
            if(enriched.getInferredTags() != null) {
                postSearch.setInferredTags(String.join(",", enriched.getInferredTags()));
            }
            postSearch.setUpdatedAt(Instant.now());
            // Note: We are not fetching Post/User here to keep this consumer lightweight.
            // We assume another process (like the initial post creation) populates the other fields.
            
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

        } catch (Exception e) {
            log.error("Error processing post-insights-enriched message: messageId={}, error={}", messageId, e.getMessage(), e);
            throw e; // Re-throw to prevent XACK on failure
        }
        // MDC.clear() is handled automatically by the try-with-resources block
    }
}

