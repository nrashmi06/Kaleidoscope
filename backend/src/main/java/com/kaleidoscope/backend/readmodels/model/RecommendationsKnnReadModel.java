package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "read_model_recommendations_knn")
public class RecommendationsKnnReadModel {
    @Id
    @Column(name = "media_id")
    private Long mediaId;

    @Column(name = "image_embedding", columnDefinition = "TEXT", nullable = false)
    private String imageEmbedding; // 1408-dim vector as JSON string

    @Column(name = "media_url", nullable = false)
    private String mediaUrl;

    @Column(name = "caption", columnDefinition = "TEXT")
    private String caption;

    @Column(name = "is_safe")
    private Boolean isSafe;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RecommendationsKnnReadModel that = (RecommendationsKnnReadModel) o;
        return mediaId != null && mediaId.equals(that.mediaId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
