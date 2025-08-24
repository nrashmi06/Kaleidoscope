package com.kaleidoscope.backend.users.service;

import com.kaleidoscope.backend.users.dto.response.CategoryAnalyticsResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserInterestResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service interface for user interest management operations
 */
public interface UserInterestService {

    /**
     * Add an interest for the authenticated user
     *
     * @param categoryId Category ID to add as interest
     */
    void addUserInterest(Long categoryId);

    /**
     * Add multiple interests for the authenticated user
     *
     * @param categoryIds List of category IDs to add as interests
     */
    void addUserInterests(List<Long> categoryIds);

    /**
     * Remove an interest for the authenticated user
     *
     * @param categoryId Category ID to remove from interests
     */
    void removeUserInterest(Long categoryId);

    /**
     * Remove multiple interests for the authenticated user
     *
     * @param categoryIds List of category IDs to remove from interests
     */
    void removeUserInterests(List<Long> categoryIds);

    /**
     * Get interests for the authenticated user
     *
     * @param pageable Pagination parameters
     * @return Paginated user interests
     */
    Page<UserInterestResponseDTO> getUserInterests(Pageable pageable);

    /**
     * Get interests for a specific user
     *
     * @param userId User ID
     * @param pageable Pagination parameters
     * @return Paginated user interests
     */
    Page<UserInterestResponseDTO> getUserInterestsByUserId(Long userId, Pageable pageable);

    /**
     * Admin: Get category interest analytics with pagination
     *
     * @param pageable Pagination parameters
     * @return Category interest analytics with user counts and pagination info
     */
    CategoryAnalyticsResponseDTO getCategoryInterestAnalytics(Pageable pageable);
}
