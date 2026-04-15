package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Read model for the personalized feed.
 * Populated per-media item when AI insights are first received.
 * target_user_id and combined_score are left null here and are
 * intended to be filled by a future personalization/ranking service.
 */
@Getter
@Setter
@Entity
@Table(name = "read_model_feed_personalized")
public class FeedPersonalizedReadModel {

    @Id
    @Column(name = "media_id")
    private Long mediaId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "uploader_id", nullable = false)
    private Long uploaderId;

    @Column(name = "uploader_username")
    private String uploaderUsername;

    @Column(name = "media_url")
    private String mediaUrl;

    @Column(name = "caption", columnDefinition = "TEXT")
    private String caption;

    @Column(name = "reaction_count")
    private Integer reactionCount;

    @Column(name = "comment_count")
    private Integer commentCount;

    @Column(name = "feed_item_id")
    private String feedItemId;

    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(name = "combined_score")
    private Double combinedScore;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FeedPersonalizedReadModel that = (FeedPersonalizedReadModel) o;
        return mediaId != null && mediaId.equals(that.mediaId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}

