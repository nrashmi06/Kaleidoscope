package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "read_model_known_faces")
public class KnownFacesReadModel {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @Column(name = "department")
    private String department;

    @Column(name = "profile_pic_url")
    private String profilePicUrl;

    @Column(name = "face_embedding", columnDefinition = "TEXT", nullable = false)
    private String faceEmbedding; // 1024-dim vector as JSON string

    @Column(name = "enrolled_at", nullable = false)
    private Instant enrolledAt;

    @Column(name = "is_active")
    private Boolean isActive;
}

