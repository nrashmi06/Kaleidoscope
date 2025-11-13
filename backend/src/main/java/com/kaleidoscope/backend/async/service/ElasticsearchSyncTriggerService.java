package com.kaleidoscope.backend.async.service;

import com.kaleidoscope.backend.async.streaming.ProducerStreamConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Service to trigger the AI team's Elasticsearch Sync Service.
 * This is called *after* any of the 7 read model tables are updated.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ElasticsearchSyncTriggerService {

    private final RedisStreamPublisher redisStreamPublisher;

    /**
     * Maps full table names to short index types expected by ES sync service.
     */
    private static final Map<String, String> TABLE_TO_INDEX_TYPE = Map.of(
        "read_model_media_search", "media_search",
        "read_model_post_search", "post_search",
        "read_model_user_search", "user_search",
        "read_model_blog_search", "blog_search",
        "read_model_hashtag_search", "hashtag_search",
        "read_model_location_search", "location_search",
        "read_model_category_search", "category_search",
        "read_model_face_search", "face_search"  // ADDED: Face search mapping
    );

    /**
     * Publishes a message to the es-sync-queue to index a document.
     *
     * @param indexName  The name of the read model table (e.g., "read_model_media_search").
     * @param documentId The ID of the record that was updated/created.
     */
    public void triggerSync(String indexName, Long documentId) {
        triggerSync(indexName, "INDEX", documentId);
    }

    /**
     * Publishes a message to the es-sync-queue.
     *
     * @param indexName  The name of the read model table (e.g., "read_model_media_search").
     * @param operation  The operation type (e.g., "INDEX", "DELETE").
     * @param documentId The ID of the record.
     */
    public void triggerSync(String indexName, String operation, Long documentId) {
        // Map table name to index type
        String indexType = TABLE_TO_INDEX_TYPE.get(indexName);
        if (indexType == null) {
            log.error("Unknown table name for ES sync: {}. Cannot trigger sync.", indexName);
            return;
        }

        log.debug("Triggering ES Sync for indexType: {}, operation: {}, documentId: {}",
                 indexType, operation, documentId);
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("indexType", indexType);
            message.put("operation", operation.toLowerCase()); // ES sync expects lowercase operation
            message.put("documentId", String.valueOf(documentId));
            message.put("timestamp", Instant.now().toString());
            message.put("correlationId", MDC.get("correlationId")); // Pass on the correlation ID

            redisStreamPublisher.publish(
                ProducerStreamConstants.ES_SYNC_QUEUE_STREAM,
                message
            );

            log.debug("Successfully published es-sync-queue message for document: {}", documentId);
        } catch (Exception e) {
            log.error("Failed to publish es-sync-queue message for document: {}", documentId, e);
            // Non-blocking error.
        }
    }
}
