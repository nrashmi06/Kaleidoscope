package com.kaleidoscope.backend.readmodel.model;

import com.kaleidoscope.backend.posts.model.Post;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "read_model_search_assets")  // Removed indexes - PostgreSQL is backup only
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadModelSearchAsset {

    @Id
    @Column(name = "media_id")
    private Long mediaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(name = "media_url")
    private String mediaUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "uploader_info", columnDefinition = "jsonb")
    private Map<String, Object> uploaderInfo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "post_info", columnDefinition = "jsonb")
    private Map<String, Object> postInfo;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "scenes", columnDefinition = "text[]")
    private String[] scenes;

    @Column(name = "image_embedding", columnDefinition = "vector(512)")
    private String imageEmbedding;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detected_users", columnDefinition = "jsonb")
    private Map<String, Object> detectedUsers;

    @Column(name = "reaction_count")
    @Builder.Default
    private Integer reactionCount = 0;

    @Column(name = "comment_count")
    @Builder.Default
    private Integer commentCount = 0;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "last_updated", nullable = false)
    private OffsetDateTime lastUpdated;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ReadModelSearchAsset that = (ReadModelSearchAsset) o;
        return mediaId != null && mediaId.equals(that.mediaId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
