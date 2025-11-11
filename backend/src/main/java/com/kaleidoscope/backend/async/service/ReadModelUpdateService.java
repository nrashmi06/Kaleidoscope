package com.kaleidoscope.backend.async.service;

import com.kaleidoscope.backend.posts.model.MediaAiInsights;
import com.kaleidoscope.backend.posts.model.MediaDetectedFace;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.readmodels.model.FaceSearchReadModel;
import com.kaleidoscope.backend.readmodels.model.MediaSearchReadModel;
import com.kaleidoscope.backend.readmodels.repository.FaceSearchReadModelRepository;
import com.kaleidoscope.backend.readmodels.repository.MediaSearchReadModelRepository;
import com.kaleidoscope.backend.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.stream.Collectors;

/**
 * Centralized service for updating the new AI Read Models.
 * This service is called by the Redis Stream consumers.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ReadModelUpdateService {

    private final MediaSearchReadModelRepository mediaSearchReadModelRepository;
    private final FaceSearchReadModelRepository faceSearchReadModelRepository;
    // Note: We are not injecting PostRepository here to get author info,
    // as PostMedia -> Post -> User is already available.

    /**
     * Creates or updates a record in the 'read_model_media_search' table.
     * This is called by MediaAiInsightsConsumer.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateMediaSearchReadModel(MediaAiInsights insights, PostMedia postMedia) {
        log.debug("Updating MediaSearchReadModel for mediaId: {}", postMedia.getMediaId());
        try {
            Post post = postMedia.getPost();
            User uploader = post.getUser();

            MediaSearchReadModel readModel = new MediaSearchReadModel();
            readModel.setMediaId(postMedia.getMediaId());
            readModel.setPostId(post.getPostId());
            readModel.setPostTitle(post.getTitle());
            
            // postAllTags is updated later by the PostAggregation consumer

            readModel.setMediaUrl(postMedia.getMediaUrl());
            readModel.setAiCaption(insights.getCaption());
            
            // Convert arrays to comma-separated strings
            if (insights.getTags() != null) {
                readModel.setAiTags(String.join(",", insights.getTags()));
            }
            if (insights.getScenes() != null) {
                readModel.setAiScenes(String.join(",", insights.getScenes()));
            }

            readModel.setImageEmbedding(convertEmbeddingToString(insights.getImageEmbedding()));
            readModel.setIsSafe(insights.getIsSafe());
            
            // detected_user_ids/usernames are updated by the FaceDetection consumer
            
            readModel.setUploaderId(uploader.getUserId());
            readModel.setUploaderUsername(uploader.getUsername());
            readModel.setUploaderDepartment(uploader.getDesignation()); // Using designation as department

            // Counts will be updated by a separate interaction sync
            readModel.setReactionCount(0); 
            readModel.setCommentCount(0);

            readModel.setCreatedAt(post.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant());
            readModel.setUpdatedAt(Instant.now());

            mediaSearchReadModelRepository.save(readModel);
            log.info("Successfully updated MediaSearchReadModel for mediaId: {}", postMedia.getMediaId());
        } catch (Exception e) {
            log.error("Failed to update MediaSearchReadModel for mediaId: {}: {}", postMedia.getMediaId(), e.getMessage(), e);
            // Don't re-throw, just log the error
        }
    }

    /**
     * Creates a record in the 'read_model_face_search' table.
     * This is called by FaceDetectionConsumer.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createFaceSearchReadModel(MediaDetectedFace face) {
        log.debug("Creating FaceSearchReadModel for faceId: {}", face.getId());
        try {
            // Navigate from MediaDetectedFace -> MediaAiInsights -> Post -> User
            Post post = face.getMediaAiInsights().getPost();
            User uploader = post.getUser();

            FaceSearchReadModel readModel = new FaceSearchReadModel();
            readModel.setFaceId(String.valueOf(face.getId())); // Use the entity ID as the unique faceId
            readModel.setMediaId(face.getMediaAiInsights().getMediaId());
            readModel.setPostId(post.getPostId());
            readModel.setFaceEmbedding(face.getEmbedding()); // This is already a JSON string
            
            // Convert bbox array to JSON string
            if (face.getBbox() != null) {
                String bboxString = "[" + java.util.Arrays.stream(face.getBbox())
                                         .map(String::valueOf)
                                         .collect(Collectors.joining(",")) + "]";
                readModel.setBbox(bboxString);
            }

            // These will be updated later by the FaceRecognition consumer
            readModel.setIdentifiedUserId(null);
            readModel.setIdentifiedUsername(null);
            readModel.setMatchConfidence(null);
            
            readModel.setUploaderId(uploader.getUserId());
            readModel.setPostTitle(post.getTitle());
            readModel.setMediaUrl(face.getMediaAiInsights().getPostMedia().getMediaUrl());
            readModel.setCreatedAt(Instant.now());

            faceSearchReadModelRepository.save(readModel);
            log.info("Successfully created FaceSearchReadModel for faceId: {}", face.getId());
        } catch (Exception e) {
            log.error("Failed to create FaceSearchReadModel for faceId: {}: {}", face.getId(), e.getMessage(), e);
        }
    }

    /**
     * Converts float[] embedding to JSON string format for storage in read models.
     * PostgreSQL stores as float[], but read models store as String.
     */
    private String convertEmbeddingToString(float[] embedding) {
        if (embedding == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(embedding[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}

