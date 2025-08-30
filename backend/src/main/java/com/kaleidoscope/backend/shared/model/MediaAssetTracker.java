package com.kaleidoscope.backend.shared.model; // Or a suitable package

import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
import com.kaleidoscope.backend.users.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Tracks the lifecycle of a media asset from upload intent to its final association
 * with a post. This table is crucial for the "mark-and-sweep" cleanup job that
 * removes orphaned files from cloud storage.
 */
@Entity
@Table(name = "media_asset_tracker", indexes = {
        @Index(name = "idx_media_asset_public_id", columnList = "public_id", unique = true),
        @Index(name = "idx_media_asset_user_id", columnList = "user_id"),
        @Index(name = "idx_media_asset_status_created_at", columnList = "status, created_at")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaAssetTracker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "asset_id")
    private Long assetId;

    /**
     * The unique ID from the cloud storage provider (e.g., Cloudinary's public_id).
     * Used to look up the asset for status updates and deletion.
     */
    @Column(name = "public_id", nullable = false, unique = true, length = 255)
    private String publicId;

    /**
     * The user who initiated the upload. Useful for debugging and analytics.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Polymorphic association: type of content this asset is linked to (e.g., BLOG, POST, STORY)
     */
    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;

    /**
     * ID of the associated content (blog, post, story, etc.)
     */
    @Column(name = "content_id")
    private Long contentId;

    /**
     * Tracks the asset's state from upload intent to final use.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MediaAssetStatus status = MediaAssetStatus.PENDING;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MediaAssetTracker that = (MediaAssetTracker) o;
        return assetId != null && assetId.equals(that.assetId);
    }

    @Override
    public int hashCode() {
        // Use a constant to ensure hash code stability before and after persistence
        return 31;
    }
}