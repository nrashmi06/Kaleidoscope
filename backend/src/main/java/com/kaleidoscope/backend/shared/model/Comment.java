package com.kaleidoscope.backend.shared.model;

import com.kaleidoscope.backend.shared.enums.CommentStatus;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.users.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
// The index for parent_comment_id has been removed from the @Table annotation
@Table(name = "comments", indexes = {
        @Index(name = "idx_comment_post_id", columnList = "post_id"),
        @Index(name = "idx_comment_user_id", columnList = "user_id"),
        @Index(name = "idx_comment_status", columnList = "status"),
        @Index(name = "idx_comment_created_at", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
@SQLDelete(sql = "UPDATE comments SET deleted_at = NOW() WHERE comment_id = ?")
@Where(clause = "deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id")
    private Long commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CommentStatus status = CommentStatus.ACTIVE;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Comment comment = (Comment) o;
        return commentId != null && commentId.equals(comment.commentId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}