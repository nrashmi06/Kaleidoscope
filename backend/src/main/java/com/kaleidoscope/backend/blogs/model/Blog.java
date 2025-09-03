package com.kaleidoscope.backend.blogs.model;

import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.users.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "blogs", indexes = {
        @Index(name = "idx_blog_user_id", columnList = "user_id"),
        @Index(name = "idx_blog_status", columnList = "blog_status"),
        @Index(name = "idx_blog_created_at", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
@SQLDelete(sql = "UPDATE blogs SET deleted_at = NOW() WHERE blog_id = ?")
@Where(clause = "deleted_at IS NULL")
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = true)
    private User reviewer;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(length = 500)
    private String summary;

    @Column(name = "word_count")
    private Integer wordCount;

    @Column(name = "read_time_minutes")
    private Integer readTimeMinutes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @Enumerated(EnumType.STRING)
    @Column(name = "blog_status", nullable = false)
    @Builder.Default
    private BlogStatus blogStatus = BlogStatus.APPROVAL_PENDING;

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

    @OneToMany(mappedBy = "blog", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BlogMedia> media = new HashSet<>();

    @OneToMany(mappedBy = "blog", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BlogCategory> categories = new HashSet<>();

    @OneToMany(mappedBy = "taggingBlog", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BlogTag> taggedBlogs = new HashSet<>();


    @PrePersist
    @PreUpdate
    private void calculateReadStats() {
        if (this.body == null || this.body.isBlank()) {
            this.wordCount = 0;
            this.readTimeMinutes = 0;
            return;
        }
        String[] words = this.body.trim().split("\\s+");
        this.wordCount = words.length;
        this.readTimeMinutes = (int) Math.ceil((double) this.wordCount / 200);
    }

    public void addMedia(BlogMedia mediaItem) {
        media.add(mediaItem);
        mediaItem.setBlog(this);
    }

    public void removeMedia(BlogMedia mediaItem) {
        media.remove(mediaItem);
        mediaItem.setBlog(null);
    }

    public void addCategory(Category category) {
        BlogCategory blogCategory = new BlogCategory(this, category);
        categories.add(blogCategory);
    }

    public void removeCategory(Category category) {
        BlogCategory toRemove = this.categories.stream()
                .filter(bc -> bc.getCategory().equals(category) && bc.getBlog().equals(this))
                .findFirst()
                .orElse(null);

        if (toRemove != null) {
            this.categories.remove(toRemove);
            toRemove.setBlog(null);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Blog blog = (Blog) o;
        return blogId != null && blogId.equals(blog.blogId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}