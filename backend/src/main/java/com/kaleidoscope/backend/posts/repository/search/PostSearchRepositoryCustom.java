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
     * @param hashtag Filter by hashtag name (optional)
     * @param locationId Filter by specific location ID (optional)
     * @param latitude Latitude for geo-distance query (optional)
     * @param longitude Longitude for geo-distance query (optional)
     * @param radiusKm Radius in kilometers for geo-distance query (optional)
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
            String hashtag,
            Long locationId,
            Double latitude,
            Double longitude,
            Double radiusKm,
            Pageable pageable
    );

    /**
     * Find personalized post suggestions for the current user
     * Uses function_score queries to rank posts based on user preferences
     *
     * @param currentUserId ID of the authenticated user
     * @param followingIds Set of user IDs that the current user follows
     * @param interestIds List of category IDs the user is interested in
     * @param blockedUserIds List of user IDs blocked by the current user
     * @param blockedByUserIds List of user IDs who blocked the current user
     * @param viewedPostIds Set of post IDs already viewed by the user (for filtering)
     * @param trendingHashtagNames List of trending hashtag names to boost in scoring
     * @param pageable Pagination and sorting parameters
     * @return Page of PostDocument ordered by personalized scoring
     */
    Page<PostDocument> findPostSuggestions(
            Long currentUserId,
            Set<Long> followingIds,
            List<Long> interestIds,
            List<Long> blockedUserIds,
            List<Long> blockedByUserIds,
            Set<String> viewedPostIds,
            List<String> trendingHashtagNames,
            Pageable pageable
    );
}
