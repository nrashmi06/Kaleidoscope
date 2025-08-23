package com.kaleidoscope.backend.posts.model;

import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
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

/**
 * Represents a post made by a user.
 * Implements soft-delete functionality via @SQLDelete and @Where.
 */
@Entity
@Table(name = "posts")
@EntityListeners(AuditingEntityListener.class)
@SQLDelete(sql = "UPDATE posts SET deleted_at = NOW() WHERE post_id = ?")
@Where(clause = "deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

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
    @Column(nullable = false)
    @Builder.Default
    private PostVisibility visibility = PostVisibility.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PostStatus status = PostStatus.PUBLISHED;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // --- Relationships ---

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<PostMedia> media = new HashSet<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<PostCategory> categories = new HashSet<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Comment> comments = new HashSet<>();

    // --- Helper Methods ---

    public void addMedia(PostMedia mediaItem) {
        media.add(mediaItem);
        mediaItem.setPost(this);
    }

    public void removeMedia(PostMedia mediaItem) {
        media.remove(mediaItem);
        mediaItem.setPost(null);
    }

    public void addCategory(Category category) {
        PostCategory postCategory = new PostCategory(this, category);
        categories.add(postCategory);
    }

    public void removeCategory(Category category) {
        PostCategory postCategory = new PostCategory(this, category);
        categories.remove(postCategory);
    }

    public void addComment(Comment comment) {
        comments.add(comment);
        comment.setPost(this);
    }

    public void removeComment(Comment comment) {
        comments.remove(comment);
        comment.setPost(null);
    }

    // --- Equals and HashCode ---

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Post post = (Post) o;
        return postId != null && postId.equals(post.postId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}