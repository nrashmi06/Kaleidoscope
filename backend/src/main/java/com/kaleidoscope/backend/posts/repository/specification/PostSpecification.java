package com.kaleidoscope.backend.posts.repository.specification;

import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.JoinType;

import java.util.Set;

/**
 * @deprecated This class has been deprecated as part of the Elite Migration from JPA to Elasticsearch.
 * All filtering and security logic has been migrated to PostSearchRepositoryImpl for better performance
 * and search capabilities. Use PostSearchRepository.findVisibleAndFilteredPosts() instead.
 *
 * Migration completed: The filterPosts endpoint now uses Elasticsearch with advanced query DSL
 * that replicates all the security and filtering logic previously implemented here.
 */
@Deprecated(since = "2025-09-30", forRemoval = true)
public class PostSpecification {

    private PostSpecification() {
        // Private constructor to prevent instantiation
    }

    /**
     * @deprecated Use Elasticsearch author filtering in PostSearchRepositoryImpl instead
     */
    @Deprecated(since = "2025-09-30", forRemoval = true)
    public static Specification<Post> hasAuthor(Long userId) {
        if (userId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("user").get("userId"), userId);
    }

    /**
     * @deprecated Use Elasticsearch category filtering in PostSearchRepositoryImpl instead
     */
    @Deprecated(since = "2025-09-30", forRemoval = true)
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

    /**
     * @deprecated Use Elasticsearch status filtering in PostSearchRepositoryImpl instead
     */
    @Deprecated(since = "2025-09-30", forRemoval = true)
    public static Specification<Post> hasStatus(PostStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    /**
     * @deprecated Use Elasticsearch visibility filtering in PostSearchRepositoryImpl instead
     */
    @Deprecated(since = "2025-09-30", forRemoval = true)
    public static Specification<Post> hasVisibility(PostVisibility visibility) {
        if (visibility == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("visibility"), visibility);
    }

    /**
     * @deprecated Use Elasticsearch full-text search in PostSearchRepositoryImpl instead
     */
    @Deprecated(since = "2025-09-30", forRemoval = true)
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

    /**
     * @deprecated Use Elasticsearch visibility rules in PostSearchRepositoryImpl instead
     */
    @Deprecated(since = "2025-09-30", forRemoval = true)
    public static Specification<Post> isVisibleToUser(Long currentUserId, Set<Long> followingIds) {
        // This specification handles the complex visibility rules for non-admin users.
        return (root, query, cb) -> cb.or(
                // Rule 1: The user is the author of the post (author can see all their posts regardless of status)
                cb.equal(root.get("user").get("userId"), currentUserId),

                // Rule 2: Post is PUBLISHED and PUBLIC (everyone can see)
                cb.and(
                        cb.equal(root.get("status"), PostStatus.PUBLISHED),
                        cb.equal(root.get("visibility"), PostVisibility.PUBLIC)
                ),

                // Rule 3: Post is PUBLISHED, for FOLLOWERS, and current user follows the author
                cb.and(
                        cb.equal(root.get("status"), PostStatus.PUBLISHED),
                        cb.equal(root.get("visibility"), PostVisibility.FOLLOWERS),
                        root.get("user").get("userId").in(followingIds)
                )
        );
    }
}