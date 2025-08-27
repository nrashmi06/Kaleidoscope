package com.kaleidoscope.backend.shared.model;

import com.kaleidoscope.backend.shared.enums.ReactionType;
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
@Table(name = "comment_reactions", indexes = {
        @Index(name = "idx_comment_reaction_comment_id", columnList = "comment_id"),
        @Index(name = "idx_comment_reaction_user_id", columnList = "user_id"),
        @Index(name = "idx_comment_reaction_user_comment", columnList = "user_id, comment_id", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@SQLDelete(sql = "UPDATE comment_reactions SET deleted_at = NOW() WHERE comment_reaction_id = ?")
@Where(clause = "deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_reaction_id")
    private Long commentReactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "reaction_type", nullable = false)
    private ReactionType reactionType;

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
        CommentReaction that = (CommentReaction) o;
        return commentReactionId != null && commentReactionId.equals(that.commentReactionId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}


