package com.kaleidoscope.backend.async.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.async.dto.PostInsightsEnrichedDTO;
import com.kaleidoscope.backend.async.exception.async.StreamDeserializationException;
import com.kaleidoscope.backend.posts.document.MediaSearchDocument;
import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.model.MediaAiInsights;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.repository.MediaAiInsightsRepository;
import com.kaleidoscope.backend.posts.repository.MediaDetectedFaceRepository;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.repository.search.PostSearchRepository;
import com.kaleidoscope.backend.posts.repository.search.MediaSearchRepository;
import com.kaleidoscope.backend.readmodels.model.MediaSearchReadModel;
import com.kaleidoscope.backend.readmodels.model.PostSearchReadModel;
import com.kaleidoscope.backend.readmodels.repository.MediaSearchReadModelRepository;
import com.kaleidoscope.backend.readmodels.repository.PostSearchReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.data.elasticsearch.core.query.IndexQuery;
import org.springframework.data.elasticsearch.core.query.IndexQueryBuilder;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

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
    private final ElasticsearchOperations elasticsearchOperations;
    private final PostRepository postRepository;  // ADDED: To fetch Post entity for author info
    private final PostSearchRepository postSearchRepository;
    private final MediaSearchRepository mediaSearchRepository;
    private final MediaAiInsightsRepository mediaAiInsightsRepository;
    private final MediaDetectedFaceRepository mediaDetectedFaceRepository;

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

            // Aggregator may emit either aggregated* or allAi* list names; normalize for storage.
            List<String> normalizedTags = chooseFirstNonEmpty(enriched.getAggregatedTags(), enriched.getAllAiTags());
            List<String> normalizedScenes = chooseFirstNonEmpty(enriched.getAggregatedScenes(), enriched.getAllAiScenes());

            if (!normalizedTags.isEmpty()) {
                postSearch.setAllAiTags(String.join(",", normalizedTags));
            }
            if (!normalizedScenes.isEmpty()) {
                postSearch.setAllAiScenes(String.join(",", normalizedScenes));
            }
            postSearch.setInferredEventType(enriched.getInferredEventType());
            postSearch.setUpdatedAt(Instant.now());

            postSearchReadModelRepository.save(postSearch);
            log.info("Updated read_model_post_search for postId: {}", postId);

            // Java owns post_search indexing; do a direct ES upsert after DB upsert.
            indexPostSearchDocument(postSearch, enriched, normalizedTags, normalizedScenes);
            log.info("Indexed post_search document for postId: {}", postId);

            // 2. Back-fill 'post_all_tags' in all related Media Search Read Models
            // (Using the efficient findByPostId method)
            List<MediaSearchReadModel> mediaModels = mediaSearchReadModelRepository.findByPostId(postId);

            if (!mediaModels.isEmpty() && !normalizedTags.isEmpty()) {
                String allTags = String.join(",", normalizedTags);
                for (MediaSearchReadModel media : mediaModels) {
                    media.setPostAllTags(allTags);
                }
                mediaSearchReadModelRepository.saveAll(mediaModels);
                log.info("Back-filled post_all_tags for {} media items in postId: {}", mediaModels.size(), postId);
            }

            // Keep `posts` index in sync for filterPosts() ML text search (mlCaptions/mlImageTags/mlScenes)
            updatePostDocumentMlFields(postId, enriched);

            // 4. Trigger ES sync for all associated media (as they were updated)
            for (MediaSearchReadModel media : mediaModels) {
                mediaSearchRepository.save(toMediaSearchDocument(media));
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

            String combinedCaption = value.get("combinedCaption");
            if (combinedCaption != null) {
                builder.combinedCaption(combinedCaption);
            }

            String isSafeStr = value.get("isSafe");
            if (isSafeStr != null && !isSafeStr.isBlank() && !"null".equalsIgnoreCase(isSafeStr)) {
                builder.isSafe(Boolean.parseBoolean(isSafeStr));
            }

            String totalFacesStr = value.get("totalFaces");
            if (totalFacesStr != null && !totalFacesStr.isBlank() && !"null".equalsIgnoreCase(totalFacesStr)) {
                builder.totalFaces(Integer.parseInt(totalFacesStr));
            }

            String mediaCountStr = value.get("mediaCount");
            if (mediaCountStr != null && !mediaCountStr.isBlank() && !"null".equalsIgnoreCase(mediaCountStr)) {
                builder.mediaCount(Integer.parseInt(mediaCountStr));
            }

            // Manually parse List<String> fields from their JSON string representation
            TypeReference<List<String>> listTypeRef = new TypeReference<>() {};

            String aggregatedTagsStr = value.get("aggregatedTags");
            if (aggregatedTagsStr != null && !aggregatedTagsStr.isEmpty() && !aggregatedTagsStr.equals("null")) {
                builder.aggregatedTags(objectMapper.readValue(aggregatedTagsStr, listTypeRef));
            } else {
                builder.aggregatedTags(Collections.emptyList());
            }

            String aggregatedScenesStr = value.get("aggregatedScenes");
            if (aggregatedScenesStr != null && !aggregatedScenesStr.isEmpty() && !aggregatedScenesStr.equals("null")) {
                builder.aggregatedScenes(objectMapper.readValue(aggregatedScenesStr, listTypeRef));
            } else {
                builder.aggregatedScenes(Collections.emptyList());
            }

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

    private List<String> chooseFirstNonEmpty(List<String> primary, List<String> fallback) {
        if (primary != null && !primary.isEmpty()) {
            return primary;
        }
        if (fallback != null && !fallback.isEmpty()) {
            return fallback;
        }
        return Collections.emptyList();
    }

    private void indexPostSearchDocument(
            PostSearchReadModel model,
            PostInsightsEnrichedDTO enriched,
            List<String> normalizedTags,
            List<String> normalizedScenes) {

        Map<String, Object> payload = new HashMap<>();
        payload.put("postId", model.getPostId());
        payload.put("authorId", model.getAuthorId());
        payload.put("authorUsername", model.getAuthorUsername());
        payload.put("authorDepartment", model.getAuthorDepartment());
        payload.put("title", model.getTitle());
        payload.put("body", model.getBody());
        payload.put("aggregatedTags", normalizedTags);
        payload.put("aggregatedScenes", normalizedScenes);
        payload.put("combinedCaption", enriched.getCombinedCaption());
        payload.put("inferredEventType", model.getInferredEventType());
        payload.put("isSafe", enriched.getIsSafe());
        payload.put("totalFaces", enriched.getTotalFaces());
        payload.put("mediaCount", enriched.getMediaCount());
        payload.put("createdAt", model.getCreatedAt());
        payload.put("updatedAt", model.getUpdatedAt());

        try {
            String json = objectMapper.writeValueAsString(payload);
            IndexQuery query = new IndexQueryBuilder()
                    .withId(String.valueOf(model.getPostId()))
                    .withSource(json)
                    .build();
            elasticsearchOperations.index(query, IndexCoordinates.of("post_search"));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize post_search payload for postId=" + model.getPostId(), e);
        }
    }

    private MediaSearchDocument toMediaSearchDocument(MediaSearchReadModel media) {
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
                .collect(Collectors.toList());
    }

    private void updatePostDocumentMlFields(Long postId, PostInsightsEnrichedDTO enriched) {
        Optional<PostDocument> postDocumentOpt = postSearchRepository.findById(postId.toString());
        if (postDocumentOpt.isEmpty()) {
            log.warn("PostDocument not found for postId: {} while applying ML aggregation update", postId);
            return;
        }

        PostDocument postDocument = postDocumentOpt.get();

        // Prefer aggregated tags/scenes from the enriched event payload
        Set<String> dedupTags = new LinkedHashSet<>();
        if (enriched.getAllAiTags() != null) {
            enriched.getAllAiTags().stream()
                    .filter(s -> s != null && !s.isBlank())
                    .map(s -> s.trim().toLowerCase(Locale.ROOT))
                    .forEach(dedupTags::add);
        }

        Set<String> dedupScenes = new LinkedHashSet<>();
        if (enriched.getAllAiScenes() != null) {
            enriched.getAllAiScenes().stream()
                    .filter(s -> s != null && !s.isBlank())
                    .map(s -> s.trim().toLowerCase(Locale.ROOT))
                    .forEach(dedupScenes::add);
        }

        // Pull captions from persisted per-media insights because enriched event does not include them
        List<MediaAiInsights> insights = mediaAiInsightsRepository.findByPost_PostId(postId);
        Set<String> dedupCaptions = new LinkedHashSet<>();
        int totalFaceCount = 0;

        for (MediaAiInsights insight : insights) {
            if (insight.getCaption() != null && !insight.getCaption().isBlank()) {
                dedupCaptions.add(insight.getCaption().trim());
            }

            if (insight.getTags() != null) {
                for (String tag : insight.getTags()) {
                    if (tag != null && !tag.isBlank()) {
                        dedupTags.add(tag.trim().toLowerCase(Locale.ROOT));
                    }
                }
            }

            if (insight.getScenes() != null) {
                for (String scene : insight.getScenes()) {
                    if (scene != null && !scene.isBlank()) {
                        dedupScenes.add(scene.trim().toLowerCase(Locale.ROOT));
                    }
                }
            }

            totalFaceCount += mediaDetectedFaceRepository.findByMediaAiInsights_MediaId(insight.getMediaId()).size();
        }

        postDocument.setMlImageTags(new ArrayList<>(dedupTags));
        postDocument.setMlScenes(new ArrayList<>(dedupScenes));
        postDocument.setMlCaptions(new ArrayList<>(dedupCaptions));
        postDocument.setPeopleCount(totalFaceCount > 0 ? totalFaceCount : null);

        postSearchRepository.save(postDocument);
        log.info("Updated PostDocument ML fields for postId: {} (tags={}, scenes={}, captions={}, faces={})",
                postId, dedupTags.size(), dedupScenes.size(), dedupCaptions.size(), totalFaceCount);
    }
}