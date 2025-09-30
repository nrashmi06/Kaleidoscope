package com.kaleidoscope.backend.ml.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.ml.dto.MediaAiInsightsResultDTO;
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
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaAiInsightsConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final MediaAiInsightsRepository mediaAiInsightsRepository;
    private final PostMediaRepository postMediaRepository;
    private final SearchAssetSearchRepository searchAssetSearchRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        try {
            log.info("Received ML insights message from Redis Stream: streamKey={}, messageId={}", 
                    record.getStream(), record.getId());

            // Deserialization: Convert the incoming MapRecord message into MediaAiInsightsResultDTO
            MediaAiInsightsResultDTO resultDTO = convertMapRecordToDTO(record);
            log.info("Successfully deserialized ML insights for mediaId: {}", resultDTO.getMediaId());

            // Data Retrieval: Find the corresponding PostMedia entity
            PostMedia postMedia = postMediaRepository.findById(resultDTO.getMediaId())
                    .orElseThrow(() -> {
                        log.error("PostMedia not found for mediaId: {}", resultDTO.getMediaId());
                        return new RuntimeException("PostMedia not found for mediaId: " + resultDTO.getMediaId());
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

            log.info("Successfully processed ML insights for mediaId: {} - PostgreSQL and Elasticsearch updated", 
                    resultDTO.getMediaId());

        } catch (Exception e) {
            log.error("Error processing ML insights message from Redis Stream: streamKey={}, messageId={}, error={}", 
                    record.getStream(), record.getId(), e.getMessage(), e);
            // Re-throw to trigger retry mechanism if configured
            throw new RuntimeException("Failed to process ML insights message", e);
        }
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
            throw new RuntimeException("Failed to deserialize ML insights message", e);
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
