package com.kaleidoscope.backend.blogs.model;

import com.kaleidoscope.backend.shared.model.Category;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "blog_categories", indexes = {
        @Index(name = "idx_blog_category_blog_id", columnList = "blog_id"),
        @Index(name = "idx_blog_category_category_id", columnList = "category_id")
})
@Getter
@Setter
@NoArgsConstructor
public class BlogCategory implements Serializable {

    @EmbeddedId
    private BlogCategoryId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("blogId")
    @JoinColumn(name = "blog_id")
    private Blog blog;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("categoryId")
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public BlogCategory(Blog blog, Category category) {
        this.blog = blog;
        this.category = category;
        this.id = new BlogCategoryId(blog.getBlogId(), category.getCategoryId());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BlogCategory that = (BlogCategory) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
