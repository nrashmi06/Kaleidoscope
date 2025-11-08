package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "read_model_post_search")
public class PostSearchReadModel {
    @Id
    @Column(name = "post_id")
    private Long postId;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(name = "author_username", nullable = false)
    private String authorUsername;

    @Column(name = "author_department")
    private String authorDepartment;

    @Column(name = "title")
    private String title;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Column(name = "all_ai_tags", columnDefinition = "TEXT")
    private String allAiTags; // Comma-separated string

    @Column(name = "all_ai_scenes", columnDefinition = "TEXT")
    private String allAiScenes; // Comma-separated string

    @Column(name = "all_detected_user_ids", columnDefinition = "TEXT")
    private String allDetectedUserIds; // Comma-separated string

    @Column(name = "inferred_event_type")
    private String inferredEventType;

    @Column(name = "inferred_tags", columnDefinition = "TEXT")
    private String inferredTags; // Comma-separated string

    @Column(name = "categories", columnDefinition = "TEXT")
    private String categories; // Comma-separated string

    @Column(name = "total_reactions")
    private Integer totalReactions;

    @Column(name = "total_comments")
    private Integer totalComments;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}

