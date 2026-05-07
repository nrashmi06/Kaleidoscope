package com.kaleidoscope.backend.users.consumer;

import com.kaleidoscope.backend.users.service.UserDocumentSyncService;

import com.kaleidoscope.backend.users.service.UserFaceEnrollmentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Consumer that listens to face embedding results from ML service for profile pictures
 * and syncs the face embedding to UserDocument in Elasticsearch and updates face enrollment tables.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserProfileFaceEmbeddingConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final UserDocumentSyncService userDocumentSyncService;
    private final UserFaceEnrollmentSyncService userFaceEnrollmentSyncService;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {

        String messageId = record.getId().getValue();
        try {
            log.info("Received user profile face embedding message from Redis Stream: streamKey={}, messageId={}",
                    record.getStream(), messageId);

            Map<String, String> recordValue = record.getValue();
            Long userId = Long.parseLong(recordValue.get("userId"));
            String embeddingStr = recordValue.get("faceEmbedding");

            if (isEmptyEmbeddingPayload(embeddingStr)) {
                log.warn("Profile face embedding is empty for userId={} (provider returned no vector). Skipping sync and acknowledging messageId={}",
                        userId, messageId);
                return;
            }

            float[] faceEmbedding = parseFaceEmbedding(embeddingStr);
            log.info("Processing face embedding for user ID: {} with vector size: {}, messageId: {}",
                    userId, faceEmbedding.length, messageId);

            // Existing behavior (users index)
            userDocumentSyncService.syncOnFaceEmbeddingGeneration(userId, faceEmbedding);

            // New behavior (PG tables + known_faces_index trigger)
            userFaceEnrollmentSyncService.upsertKnownFace(userId, faceEmbedding);

            log.info("Successfully completed profile face enrollment sync for user ID: {}, messageId: {}",
                    userId, messageId);
        } catch (NumberFormatException e) {
            log.error("Invalid userId format in face embedding message: streamKey={}, messageId={}, error={}. Message will remain in PEL.",
                    record.getStream(), messageId, e.getMessage(), e);
            throw e;
        } catch (IllegalArgumentException e) {
            log.error("Invalid face embedding format in message: streamKey={}, messageId={}, error={}. Message will remain in PEL.",
                    record.getStream(), messageId, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Error processing user profile face embedding message from Redis Stream: streamKey={}, messageId={}, error={}. Message will remain in PEL.",
                    record.getStream(), messageId, e.getMessage(), e);
            throw e;
        }
    }

    private float[] parseFaceEmbedding(String embeddingStr) {
        try {
            if (embeddingStr == null || embeddingStr.isBlank()) {
                throw new IllegalArgumentException("Face embedding payload is blank");
            }

            String cleaned = embeddingStr.trim().replaceAll("[\\[\\]\\s]", "");
            if (cleaned.isBlank()) {
                throw new IllegalArgumentException("Face embedding payload is empty");
            }

            String[] parts = cleaned.split(",");
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

    private boolean isEmptyEmbeddingPayload(String embeddingStr) {
        if (embeddingStr == null) return true;
        String trimmed = embeddingStr.trim();
        return trimmed.isEmpty() || "[]".equals(trimmed) || "[ ]".equals(trimmed);
    }
}

