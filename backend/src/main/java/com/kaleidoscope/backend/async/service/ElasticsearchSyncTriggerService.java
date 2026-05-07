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
 * This is called *after* any of the read model tables are updated.
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
            "read_model_face_search", "face_search",
            "read_model_recommendations_knn", "recommendations_knn",
            "read_model_feed_personalized", "feed_personalized",
            "read_model_known_faces", "known_faces_index"
    );

    /**
     * Publishes a message to the es-sync-queue to index a document.
     *
     * @param indexName  The name of the read model table (e.g., "read_model_media_search").
     * @param documentId The ID of the record that was updated/created.
     */
    public void triggerSync(String indexName, Long documentId) {
        if (documentId == null) {
            log.warn("Skipping ES sync trigger for {} due to null documentId", indexName);
            return;
        }
        triggerSync(indexName, "INDEX", String.valueOf(documentId));
    }

    /**
     * Publishes a message to the es-sync-queue to index a document using a String ID.
     *
     * @param indexName  The name of the read model table.
     * @param documentId The String ID of the record.
     */
    public void triggerSync(String indexName, String documentId) {
        triggerSync(indexName, "INDEX", documentId);
    }

    /**
     * Publishes a message to the es-sync-queue with a specific operation.
     *
     * @param indexName  The name of the read model table.
     * @param operation  The operation type (e.g., "INDEX", "DELETE").
     * @param documentId The ID of the record.
     */
    public void triggerSync(String indexName, String operation, Long documentId) {
        if (documentId == null) {
            log.warn("Skipping ES sync trigger for {} due to null documentId", indexName);
            return;
        }
        triggerSync(indexName, operation, String.valueOf(documentId));
    }

    /**
     * Publishes a message to the es-sync-queue with a specific operation and String ID.
     *
     * @param indexName  The name of the read model table.
     * @param operation  The operation type (e.g., "INDEX", "DELETE").
     * @param documentId The String ID of the record.
     */
    public void triggerSync(String indexName, String operation, String documentId) {
        String indexType = TABLE_TO_INDEX_TYPE.get(indexName);
        if (indexType == null) {
            log.error("Unknown table name for ES sync: {}. Cannot trigger sync.", indexName);
            return;
        }

        if (documentId == null || documentId.isBlank()) {
            log.warn("Skipping ES sync trigger for {} due to blank documentId", indexName);
            return;
        }

        log.debug("Triggering ES Sync for indexType: {}, operation: {}, documentId: {}",
                indexType, operation, documentId);

        try {
            Map<String, Object> message = new HashMap<>();
            message.put("indexType", indexType);
            message.put("operation", operation.toLowerCase());
            message.put("documentId", documentId);
            message.put("timestamp", Instant.now().toString());
            message.put("correlationId", MDC.get("correlationId"));

            redisStreamPublisher.publish(ProducerStreamConstants.ES_SYNC_QUEUE_STREAM, message);
            log.debug("Published es-sync message indexType={}, documentId={}", indexType, documentId);
        } catch (Exception e) {
            log.error("Failed to publish es-sync message indexName={}, documentId={}", indexName, documentId, e);
        }
    }
}

