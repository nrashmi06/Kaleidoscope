package com.kaleidoscope.backend.users.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.users.service.UserDocumentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Consumer that listens to face embedding results from ML service for profile pictures
 * and syncs the face embedding to UserDocument in Elasticsearch
 */
@Component // Changed from @Service for injection into RedisStreamConfig
@RequiredArgsConstructor
@Slf4j
public class UserProfileFaceEmbeddingConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final UserDocumentSyncService userDocumentSyncService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        // Retrieve the message ID for logging/XACK reference
        String messageId = record.getId().getValue();
        try {
            log.info("Received user profile face embedding message from Redis Stream: streamKey={}, messageId={}",
                    record.getStream(), messageId);

            Map<String, String> recordValue = record.getValue();

            // Extract data from the stream message
            Long userId = Long.parseLong(recordValue.get("userId"));
            String embeddingStr = recordValue.get("faceEmbedding");

            // Parse face embedding array
            float[] faceEmbedding = parseFaceEmbedding(embeddingStr);

            log.info("Processing face embedding for user ID: {} with vector size: {}, messageId: {}",
                    userId, faceEmbedding.length, messageId);

            // Sync to UserDocument in Elasticsearch
            userDocumentSyncService.syncOnFaceEmbeddingGeneration(userId, faceEmbedding);

            log.info("Successfully synced face embedding to UserDocument for user ID: {}, messageId: {}", userId, messageId);

        } catch (Exception e) {
            log.error("Error processing user profile face embedding message from Redis Stream: streamKey={}, messageId={}, error={}. Message will remain in PEL.",
                    record.getStream(), messageId, e.getMessage(), e);
            throw e; // Re-throw to prevent XACK on failure
        }
    }

    /**
     * Parse face embedding from string representation
     * Expected format: "[0.1, 0.2, 0.3, ...]" or "0.1,0.2,0.3,..."
     */
    private float[] parseFaceEmbedding(String embeddingStr) {
        try {
            // Remove brackets and whitespace
            String cleaned = embeddingStr.trim().replaceAll("[\\[\\]\\s]", "");
            
            // Split by comma
            String[] parts = cleaned.split(",");
            
            // Convert to float array
            float[] embedding = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                embedding[i] = Float.parseFloat(parts[i].trim());
            }
            
            return embedding;
        } catch (Exception e) {
            log.error("Failed to parse face embedding: {}", embeddingStr, e);
            throw new IllegalArgumentException("Invalid face embedding format", e);
        }
    }
}
