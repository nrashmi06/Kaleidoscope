package com.kaleidoscope.backend.posts.service;

import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for generating personalized post suggestions
 * Uses Elasticsearch function_score queries to rank posts based on:
 * - User follows
 * - User interests
 * - Post popularity (reactions, comments, views)
 * - Post recency
 */
public interface PostSuggestionService {
    
    /**
     * Get personalized post suggestions for the current authenticated user
     * 
     * @param pageable Pagination and sorting parameters
     * @return Paginated response of post summaries ordered by relevance score
     */
    PaginatedResponse<PostSummaryResponseDTO> getPostSuggestions(Pageable pageable);
}

