package com.kaleidoscope.backend.blogs.service;

import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for generating personalized blog suggestions/feed
 * Mirrors PostSuggestionService functionality for blogs
 */
public interface BlogSuggestionService {
    /**
     * Get personalized blog suggestions for the current user
     * Uses Elasticsearch function_score query with advanced ranking
     * @param pageable Pagination parameters
     * @return Paginated list of blog suggestions
     */
    PaginatedResponse<BlogSummaryResponseDTO> getBlogSuggestions(Pageable pageable);
}

