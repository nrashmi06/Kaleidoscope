package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "read_model_feed_personalized")
public class FeedPersonalizedReadModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "feed_item_id", unique = true, nullable = false)
    private String feedItemId;

    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;

    @Column(name = "media_id", nullable = false)
    private Long mediaId;

    @Column(name = "media_url")
    private String mediaUrl;

    @Column(name = "caption", columnDefinition = "TEXT")
    private String caption;

    @Column(name = "uploader_id", nullable = false)
    private Long uploaderId;

    @Column(name = "uploader_username")
    private String uploaderUsername;

    @Column(name = "combined_score")
    private Float combinedScore;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FeedPersonalizedReadModel that = (FeedPersonalizedReadModel) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
