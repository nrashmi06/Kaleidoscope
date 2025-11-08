package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "read_model_face_search")
public class FaceSearchReadModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "face_id", unique = true, nullable = false)
    private String faceId;

    @Column(name = "media_id", nullable = false)
    private Long mediaId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "face_embedding", columnDefinition = "TEXT", nullable = false)
    private String faceEmbedding; // 1024-dim vector as JSON string

    @Column(name = "bbox", columnDefinition = "TEXT")
    private String bbox; // Stored as JSON string "[x,y,w,h]"

    @Column(name = "identified_user_id")
    private Long identifiedUserId;

    @Column(name = "identified_username")
    private String identifiedUsername;

    @Column(name = "match_confidence")
    private Float matchConfidence;

    @Column(name = "uploader_id", nullable = false)
    private Long uploaderId;

    @Column(name = "post_title")
    private String postTitle;

    @Column(name = "media_url")
    private String mediaUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}

