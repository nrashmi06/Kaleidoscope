package com.kaleidoscope.backend.posts.model;

import com.kaleidoscope.backend.shared.enums.MediaType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "post_media")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "media_id")
    private Long mediaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false)
    private MediaType mediaType;

    @Column(name = "media_url", nullable = false, length = 255)
    private String mediaUrl;

    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;

    private Integer width;
    private Integer height;

    @Column(name = "file_size_kb")
    private Integer fileSizeKb;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extra_metadata", columnDefinition = "jsonb")
    private Map<String, Object> extraMetadata;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PostMedia postMedia = (PostMedia) o;
        return mediaId != null && mediaId.equals(postMedia.mediaId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}