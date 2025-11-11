package com.kaleidoscope.backend.posts.model;

import com.kaleidoscope.backend.posts.enums.MediaAiStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "media_ai_insights")  // Removed indexes - PostgreSQL is backup only
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaAiInsights {

    @Id
    @Column(name = "media_id")
    private Long mediaId;

    @Version
    @Column(name = "version")
    private Long version;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", nullable = false)
    @MapsId
    private PostMedia postMedia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaAiStatus status;

    @Column(name = "is_safe")
    private Boolean isSafe;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "scenes", columnDefinition = "text[]")
    private String[] scenes;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "image_embedding", columnDefinition = "vector(512)")
    private float[] imageEmbedding;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MediaAiInsights that = (MediaAiInsights) o;
        return mediaId != null && mediaId.equals(that.mediaId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
