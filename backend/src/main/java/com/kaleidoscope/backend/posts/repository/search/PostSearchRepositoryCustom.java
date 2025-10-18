package com.kaleidoscope.backend.posts.repository.search;

import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

/**
 * Custom repository interface for complex PostDocument search operations
 * Defines the contract for advanced Elasticsearch queries with security and filtering logic
 */
public interface PostSearchRepositoryCustom {
    
    /**
     * Find posts that are visible to the current user with comprehensive filtering
     * Replicates the complex security logic from PostSpecification using Elasticsearch queries
     * 
     * @param currentUserId ID of the authenticated user
     * @param followingIds Set of user IDs that the current user follows
     * @param userId Filter by author ID (optional)
     * @param categoryId Filter by category ID (optional)
     * @param status Filter by post status (optional)
     * @param visibility Filter by post visibility (optional)
     * @param query Text search query across title, summary, and body (optional)
     * @param pageable Pagination and sorting parameters
     * @return Page of PostDocument matching the criteria and visible to the user
     */
    Page<PostDocument> findVisibleAndFilteredPosts(
            Long currentUserId,
            Set<Long> followingIds,
            Long userId,
            Long categoryId,
            PostStatus status,
            PostVisibility visibility,
            String query,
            Pageable pageable
    );

    /**
     * Find personalized post suggestions using Elasticsearch function_score query
     * Ranks posts based on multiple factors:
     * - Following: Posts from users the current user follows (high weight)
     * - Interests: Posts in categories the user is interested in (medium weight)
     * - Popularity: Posts with high engagement (reactions, comments, views)
     * - Recency: Newer posts are preferred
     *
     * @param currentUserId ID of the authenticated user
     * @param followingIds Set of user IDs that the current user follows
     * @param interestIds List of category IDs the user is interested in
     * @param blockedUserIds List of user IDs blocked by the current user
     * @param blockedByUserIds List of user IDs who have blocked the current user
     * @param viewedPostIds Set of post IDs already viewed by the user (for filtering)
     * @param pageable Pagination and sorting parameters
     * @return Page of PostDocument ordered by relevance score
     */
    Page<PostDocument> findPostSuggestions(
            Long currentUserId,
            Set<Long> followingIds,
            List<Long> interestIds,
            List<Long> blockedUserIds,
            List<Long> blockedByUserIds,
            Set<String> viewedPostIds,
            Pageable pageable
    );
}
