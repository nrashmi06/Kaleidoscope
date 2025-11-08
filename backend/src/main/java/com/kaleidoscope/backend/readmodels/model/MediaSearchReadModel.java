package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "read_model_media_search")
public class MediaSearchReadModel {
    @Id
    @Column(name = "media_id")
    private Long mediaId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "post_title")
    private String postTitle;

    @Column(name = "post_all_tags", columnDefinition = "TEXT")
    private String postAllTags; // Comma-separated string

    @Column(name = "media_url", nullable = false)
    private String mediaUrl;

    @Column(name = "ai_caption", columnDefinition = "TEXT")
    private String aiCaption;

    @Column(name = "ai_tags", columnDefinition = "TEXT")
    private String aiTags; // Comma-separated string

    @Column(name = "ai_scenes", columnDefinition = "TEXT")
    private String aiScenes; // Comma-separated string

    @Column(name = "image_embedding", columnDefinition = "TEXT")
    private String imageEmbedding; // 512-dim vector as JSON string

    @Column(name = "is_safe")
    private Boolean isSafe;

    @Column(name = "detected_user_ids", columnDefinition = "TEXT")
    private String detectedUserIds; // Comma-separated string

    @Column(name = "detected_usernames", columnDefinition = "TEXT")
    private String detectedUsernames; // Comma-separated string

    @Column(name = "uploader_id", nullable = false)
    private Long uploaderId;

    @Column(name = "uploader_username", nullable = false)
    private String uploaderUsername;

    @Column(name = "uploader_department")
    private String uploaderDepartment;

    @Column(name = "reaction_count")
    private Integer reactionCount;

    @Column(name = "comment_count")
    private Integer commentCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
