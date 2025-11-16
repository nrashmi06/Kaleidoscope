package com.kaleidoscope.backend.blogs.consumer;

import com.kaleidoscope.backend.blogs.document.BlogDocument;
import com.kaleidoscope.backend.blogs.repository.search.BlogSearchRepository;
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
 * Redis Stream consumer for synchronizing blog interaction counts to Elasticsearch
 * Listens to BLOG_INTERACTION_SYNC_STREAM and updates reactionCount and commentCount
 * in BlogDocument when reactions or comments are added/removed
 */
@Component // Changed from @Service for injection into RedisStreamConfig
@RequiredArgsConstructor
@Slf4j
public class BlogInteractionSyncConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final BlogSearchRepository blogSearchRepository;
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

            log.info("[BlogInteractionSyncConsumer] Processing interaction sync for blog {} - changeType: {}, messageId: {}",
                    contentId, changeType, messageId);

            // Fetch current counts from database
            long currentReactionCount = reactionRepository.countByContentIdAndContentType(contentId, ContentType.BLOG);
            long currentCommentCount = commentRepository.countByContentIdAndContentType(contentId, ContentType.BLOG);

            log.debug("[BlogInteractionSyncConsumer] Current counts for blog {}: reactions={}, comments={}",
                     contentId, currentReactionCount, currentCommentCount);

            // Find and update the BlogDocument in Elasticsearch
            blogSearchRepository.findById(contentId.toString()).ifPresentOrElse(
                document -> {
                    try {
                        BlogDocument updatedDocument = document.toBuilder()
                                .reactionCount(currentReactionCount)
                                .commentCount(currentCommentCount)
                                .build();

                        blogSearchRepository.save(updatedDocument);

                        log.info("[BlogInteractionSyncConsumer] Successfully updated Elasticsearch counts for blog {}: " +
                                "reactions={}, comments={}, messageId={}", contentId, currentReactionCount, currentCommentCount, messageId);

                    } catch (Exception e) {
                        log.error("[BlogInteractionSyncConsumer] Failed to update BlogDocument for blog {}, messageId={}: {}",
                                 contentId, messageId, e.getMessage(), e);
                        throw e; // Re-throw to prevent XACK
                    }
                },
                () -> log.warn("[BlogInteractionSyncConsumer] BlogDocument not found in Elasticsearch for blogId: {}, messageId: {}",
                            contentId, messageId)
            );

        } catch (Exception e) {
            log.error("[BlogInteractionSyncConsumer] Error processing interaction sync event, messageId={}: {}",
                     messageId, e.getMessage(), e);
            throw e; // Re-throw to prevent XACK on failure
        }
    }
}

