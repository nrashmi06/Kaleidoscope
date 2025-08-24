package com.kaleidoscope.backend.posts.model;

import com.kaleidoscope.backend.users.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_saves", indexes = {
        @Index(name = "idx_post_save_post_id", columnList = "post_id"),
        @Index(name = "idx_post_save_user_id", columnList = "user_id"),
        @Index(name = "idx_post_save_created_at", columnList = "created_at"),
        @Index(name = "idx_post_save_user_post", columnList = "user_id, post_id", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostSave {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "save_id")
    private Long saveId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PostSave postSave = (PostSave) o;
        return saveId != null && saveId.equals(postSave.saveId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}