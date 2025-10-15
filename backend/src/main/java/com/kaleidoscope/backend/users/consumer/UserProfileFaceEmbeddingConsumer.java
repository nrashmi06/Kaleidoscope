package com.kaleidoscope.backend.users.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.users.service.UserDocumentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Consumer that listens to face embedding results from ML service for profile pictures
 * and syncs the face embedding to UserDocument in Elasticsearch
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileFaceEmbeddingConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final UserDocumentSyncService userDocumentSyncService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        try {
            log.info("Received user profile face embedding message from Redis Stream: streamKey={}, messageId={}",
                    record.getStream(), record.getId());

            Map<String, String> recordValue = record.getValue();

            // Extract data from the stream message
            Long userId = Long.parseLong(recordValue.get("userId"));
            String embeddingStr = recordValue.get("faceEmbedding");

            // Parse face embedding array
            float[] faceEmbedding = parseFaceEmbedding(embeddingStr);

            log.info("Processing face embedding for user ID: {} with vector size: {}", userId, faceEmbedding.length);

            // Sync to UserDocument in Elasticsearch
            userDocumentSyncService.syncOnFaceEmbeddingGeneration(userId, faceEmbedding);

            log.info("Successfully synced face embedding to UserDocument for user ID: {}", userId);

        } catch (Exception e) {
            log.error("Error processing user profile face embedding message from Redis Stream: streamKey={}, messageId={}, error={}",
                    record.getStream(), record.getId(), e.getMessage(), e);
            // Don't re-throw - we don't want to break the stream processing
            // You can implement retry logic or dead-letter queue here if needed
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

