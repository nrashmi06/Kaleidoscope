package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.users.model.UserInterest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {

    /**
     * Find user interest by user ID and category ID
     */
    Optional<UserInterest> findByUser_UserIdAndCategory_CategoryId(Long userId, Long categoryId);

    /**
     * Find all interests for a specific user with pagination
     */
    Page<UserInterest> findByUser_UserId(Long userId, Pageable pageable);

    /**
     * Check if user has interest in specific category
     */
    boolean existsByUser_UserIdAndCategory_CategoryId(Long userId, Long categoryId);

    /**
     * Find user interests by user ID and category IDs (for bulk operations)
     */
    List<UserInterest> findByUser_UserIdAndCategory_CategoryIdIn(Long userId, List<Long> categoryIds);

    /**
     * Get user count statistics for categories in bulk (optimized)
     */
    @Query("SELECT ui.category.categoryId, COUNT(DISTINCT ui.user.userId) " +
           "FROM UserInterest ui " +
           "WHERE ui.category.categoryId IN :categoryIds " +
           "GROUP BY ui.category.categoryId")
    List<Object[]> countUsersByCategoryIds(@Param("categoryIds") List<Long> categoryIds);

    /**
     * Count distinct users who have any interests
     */
    @Query("SELECT COUNT(DISTINCT ui.user.userId) FROM UserInterest ui")
    Long countDistinctByUser();

    /**
     * Check if a user has any interests
     */
    boolean existsByUser_UserId(Long userId);
}
