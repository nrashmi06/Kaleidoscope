package com.kaleidoscope.backend.blogs.model;

import com.kaleidoscope.backend.shared.model.Category;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "blog_categories", indexes = {
        @Index(name = "idx_blog_category_is_primary", columnList = "is_primary"),
        @Index(name = "idx_blog_category_blog_category", columnList = "blog_id, category_id", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blog_category_id")
    private Long blogCategoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blog_id", nullable = false)
    private Blog blog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Custom constructor for use in Blog helper methods
    public BlogCategory(Blog blog, Category category) {
        this.blog = blog;
        this.category = category;
        this.isPrimary = false; // Initialize isPrimary to prevent null constraint violation
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BlogCategory that = (BlogCategory) o;
        return blogCategoryId != null && blogCategoryId.equals(that.blogCategoryId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
