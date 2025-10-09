package com.kaleidoscope.backend.posts.repository.search;

import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
}
