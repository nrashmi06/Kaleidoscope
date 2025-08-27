package com.kaleidoscope.backend.blogs.model;

import com.kaleidoscope.backend.blogs.enums.BlogCategory;
import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "blogs",
    indexes = {
        @Index(columnList = "user_id"),
        @Index(columnList = "location_id"),
        @Index(columnList = "blog_status"),
        @Index(columnList = "created_at"),
        @Index(columnList = "deleted_at")
    }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Blog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blog_id")
    private Long blogId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Column(name = "summary", length = 500)
    private String summary;

    @Column(name = "word_count")
    private Integer wordCount;

    @Column(name = "read_time_minutes")
    private Integer readTimeMinutes;

    @Column(name = "location_id")
    private Long locationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "blog_status", nullable = false)
    private BlogStatus blogStatus = BlogStatus.PUBLISHED;

    @Enumerated(EnumType.STRING)
    @Column(name = "blog_category")
    private BlogCategory blogCategory;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
