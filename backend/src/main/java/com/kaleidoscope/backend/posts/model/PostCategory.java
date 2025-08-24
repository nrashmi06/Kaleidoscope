package com.kaleidoscope.backend.posts.model;

import com.kaleidoscope.backend.shared.model.Category;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_categories", indexes = {
        @Index(name = "idx_post_category_post_id", columnList = "post_id"),
        @Index(name = "idx_post_category_category_id", columnList = "category_id"),
        @Index(name = "idx_post_category_is_primary", columnList = "is_primary"),
        @Index(name = "idx_post_category_created_at", columnList = "created_at"),
        @Index(name = "idx_post_category_post_category", columnList = "post_id, category_id", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_category_id")
    private Long postCategoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Custom constructor for use in Post helper methods
    public PostCategory(Post post, Category category) {
        this.post = post;
        this.category = category;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PostCategory that = (PostCategory) o;
        return postCategoryId != null && postCategoryId.equals(that.postCategoryId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}