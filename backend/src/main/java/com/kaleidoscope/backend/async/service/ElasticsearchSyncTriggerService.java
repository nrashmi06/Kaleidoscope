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
        log.debug("Triggering ES Sync for index: {}, operation: {}, documentId: {}",
                 indexName, operation, documentId);
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("indexName", indexName);
            message.put("operation", operation);
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

