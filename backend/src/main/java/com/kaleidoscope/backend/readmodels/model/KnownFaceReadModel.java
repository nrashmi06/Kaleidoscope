package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "read_model_known_faces")
public class KnownFaceReadModel {

    @Id
    @Column(name = "face_id", nullable = false, length = 100)
    private String faceId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "department", length = 200)
    private String department;

    @Column(name = "profile_pic_url", length = 1000)
    private String profilePicUrl;

    @Column(name = "face_embedding", columnDefinition = "vector(1408)")
    private String faceEmbedding;

    @Column(name = "enrolled_at", nullable = false)
    private Instant enrolledAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
