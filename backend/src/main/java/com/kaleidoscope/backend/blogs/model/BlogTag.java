package com.kaleidoscope.backend.blogs.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "blog_tags",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"tagging_blog_id", "tagged_blog_id"})
    },
    indexes = {
        @Index(columnList = "tagging_blog_id"),
        @Index(columnList = "tagged_blog_id")
    }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blog_tag_id")
    private Long blogTagId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tagging_blog_id", nullable = false, referencedColumnName = "blog_id")
    private Blog taggingBlog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tagged_blog_id", nullable = false, referencedColumnName = "blog_id")
    private Blog taggedBlog;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
