package com.kaleidoscope.backend.async.consumer;

import com.kaleidoscope.backend.shared.repository.HashtagRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class HashtagUsageSyncConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final HashtagRepository hashtagRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        String messageId = record.getId().getValue();
        Map<String, String> value = record.getValue();
        String correlationId = value.get("correlationId");

        // Set correlationId in MDC for this thread
        try (var ignored = MDC.putCloseable("correlationId", correlationId)) {

            log.info("Received hashtag usage sync message from Redis Stream: streamKey={}, messageId={}",
                    record.getStream(), messageId);

            // Extract data from the record
            String hashtagName = value.get("hashtagName");
            int change = Integer.parseInt(value.get("change"));

            log.info("Processing hashtag usage update: hashtag='{}', change={}", hashtagName, change);

            // Update the hashtag usage count using the bulk update method
            int rowsUpdated = hashtagRepository.updateUsageCount(hashtagName, change);

            // Flush and clear to ensure the update is executed immediately
            entityManager.flush();
            entityManager.clear();

            if (rowsUpdated > 0) {
                log.info("Successfully updated usage count for hashtag '{}' by {}", hashtagName, change);
            } else {
                log.warn("No hashtag found with name '{}' or update would result in negative count", hashtagName);
            }

        } catch (NumberFormatException e) {
            log.error("Failed to parse change value from message {}: {}", messageId, e.getMessage(), e);
            throw e; // Re-throw to prevent XACK
        } catch (Exception e) {
            log.error("Unexpected error processing hashtag usage sync message {}: {}", 
                    messageId, e.getMessage(), e);
            throw e; // Re-throw to prevent XACK
        }
        // MDC.clear() is handled automatically by the try-with-resources block
    }
}
