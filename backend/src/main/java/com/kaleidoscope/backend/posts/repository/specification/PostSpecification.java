package com.kaleidoscope.backend.posts.repository.specification;

import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.JoinType;

import java.util.Set;

public class PostSpecification {

    private PostSpecification() {
        // Private constructor to prevent instantiation
    }

    public static Specification<Post> hasAuthor(Long userId) {
        if (userId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("user").get("userId"), userId);
    }

    public static Specification<Post> hasCategory(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return (root, query, cb) -> {
            // Use a JOIN to link to the PostCategory and then to Category
            var join = root.join("categories", JoinType.INNER).join("category", JoinType.INNER);
            return cb.equal(join.get("categoryId"), categoryId);
        };
    }

    public static Specification<Post> hasStatus(PostStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Post> hasVisibility(PostVisibility visibility) {
        if (visibility == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("visibility"), visibility);
    }

    public static Specification<Post> containsQuery(String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) {
            return null;
        }
        String likePattern = "%" + searchTerm.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), likePattern),
                cb.like(cb.lower(root.get("summary")), likePattern),
                cb.like(cb.lower(root.get("body")), likePattern)
        );
    }

    public static Specification<Post> isVisibleToUser(Long currentUserId, Set<Long> followingIds) {
        // This specification handles the complex visibility rules for non-admin users.
        return (root, query, cb) -> cb.or(
                // Rule 1: Post is PUBLISHED and PUBLIC
                cb.and(
                        cb.equal(root.get("status"), PostStatus.PUBLISHED),
                        cb.equal(root.get("visibility"), PostVisibility.PUBLIC)
                ),
                // Rule 2: The user is the author of the post
                cb.equal(root.get("user").get("userId"), currentUserId),
                // Rule 3: Post is for FOLLOWERS and the user is in the author's following list
                cb.and(
                        cb.equal(root.get("visibility"), PostVisibility.FOLLOWERS),
                        root.get("user").get("userId").in(followingIds)
                )
        );
    }
}