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

@Entity
@Table(name = "posts", indexes = {
        @Index(name = "idx_post_user_id", columnList = "user_id"),
        @Index(name = "idx_post_status", columnList = "status"),
        @Index(name = "idx_post_visibility", columnList = "visibility"),
        @Index(name = "idx_post_created_at", columnList = "created_at")
})
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
    private PostStatus status = PostStatus.ARCHIVED;

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

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<PostMedia> media = new HashSet<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<PostCategory> categories = new HashSet<>();

    // --- THIS RELATIONSHIP IS NOW LOGICAL, SO WE REMOVE THE MAPPING ---
    // @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    // @Builder.Default
    // private Set<Comment> comments = new HashSet<>();

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
        PostCategory toRemove = this.categories.stream()
                .filter(pc -> pc.getCategory().equals(category) && pc.getPost().equals(this))
                .findFirst()
                .orElse(null);

        if (toRemove != null) {
            this.categories.remove(toRemove);
            toRemove.setPost(null);
        }
    }

    // --- HELPER METHODS FOR COMMENTS ARE NO LONGER NEEDED HERE ---
    // public void addComment(Comment comment) {
    //     comments.add(comment);
    //     comment.setPost(this);
    // }
    //
    // public void removeComment(Comment comment) {
    //     comments.remove(comment);
    //     comment.setPost(null);
    // }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Post post = (Post) o;
        return postId != null && postId.equals(post.postId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}