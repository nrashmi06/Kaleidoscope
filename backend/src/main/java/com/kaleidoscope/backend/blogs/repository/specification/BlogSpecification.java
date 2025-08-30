package com.kaleidoscope.backend.blogs.repository.specification;

import com.kaleidoscope.backend.blogs.model.Blog;
import org.springframework.data.jpa.domain.Specification;

public class BlogSpecification {
    private BlogSpecification() {}

    public static Specification<Blog> hasAuthor(Long userId) {
        if (userId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("user").get("userId"), userId);
    }

    public static Specification<Blog> hasCategory(Long categoryId) {
        if (categoryId == null) return null;
        return (root, query, cb) -> cb.isMember(categoryId, root.get("categories").get("categoryId"));
    }

    public static Specification<Blog> hasStatus(String status) {
        if (status == null) return null;
        return (root, query, cb) -> cb.equal(root.get("blogStatus"), status);
    }

    public static Specification<Blog> containsQuery(String q) {
        if (q == null || q.isEmpty()) return null;
        String likePattern = "%" + q.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
            cb.like(cb.lower(root.get("title")), likePattern),
            cb.like(cb.lower(root.get("summary")), likePattern)
        );
    }
}

