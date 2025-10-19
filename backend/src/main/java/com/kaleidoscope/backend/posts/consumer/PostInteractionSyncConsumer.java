package com.kaleidoscope.backend.posts.consumer;

import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.repository.search.PostSearchRepository;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.repository.CommentRepository;
import com.kaleidoscope.backend.shared.repository.ReactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Redis Stream consumer for synchronizing post interaction counts to Elasticsearch
 * Listens to POST_INTERACTION_SYNC_STREAM and updates reactionCount and commentCount
 * in PostDocument when reactions or comments are added/removed
 */
@Component // Changed from @Service for injection into RedisStreamConfig
@RequiredArgsConstructor
@Slf4j
public class PostInteractionSyncConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final PostSearchRepository postSearchRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        // Retrieve the message ID for logging/XACK reference
        String messageId = record.getId().getValue();
        try {
            Long contentId = Long.valueOf(record.getValue().get("contentId"));
            String changeType = record.getValue().get("changeType");

            log.info("[PostInteractionSyncConsumer] Processing interaction sync for post {} - changeType: {}, messageId: {}",
                    contentId, changeType, messageId);

            // Fetch current counts from database
            long currentReactionCount = reactionRepository.countByContentIdAndContentType(contentId, ContentType.POST);
            long currentCommentCount = commentRepository.countByContentIdAndContentType(contentId, ContentType.POST);

            log.debug("[PostInteractionSyncConsumer] Current counts for post {}: reactions={}, comments={}", 
                     contentId, currentReactionCount, currentCommentCount);

            // Find and update the PostDocument in Elasticsearch
            postSearchRepository.findById(contentId.toString()).ifPresentOrElse(
                document -> {
                    try {
                        PostDocument updatedDocument = document.toBuilder()
                                .reactionCount(currentReactionCount)
                                .commentCount(currentCommentCount)
                                .build();
                        
                        postSearchRepository.save(updatedDocument);
                        
                        log.info("[PostInteractionSyncConsumer] Successfully updated Elasticsearch counts for post {}: " +
                                "reactions={}, comments={}, messageId={}", contentId, currentReactionCount, currentCommentCount, messageId);

                    } catch (Exception e) {
                        log.error("[PostInteractionSyncConsumer] Failed to update PostDocument for post {}, messageId={}: {}",
                                 contentId, messageId, e.getMessage(), e);
                        throw e; // Re-throw to prevent XACK
                    }
                },
                () -> log.warn("[PostInteractionSyncConsumer] PostDocument not found in Elasticsearch for postId: {}, messageId: {}",
                            contentId, messageId)
            );

        } catch (Exception e) {
            log.error("[PostInteractionSyncConsumer] Error processing interaction sync event, messageId={}: {}",
                     messageId, e.getMessage(), e);
            throw e; // Re-throw to prevent XACK on failure
        }
    }
}
