package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        KnownFacesReadModel that = (KnownFacesReadModel) o;
        return userId != null && userId.equals(that.userId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
