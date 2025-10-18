package com.kaleidoscope.backend.users.repository.search;

import com.kaleidoscope.backend.users.document.UserDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

/**
 * Custom repository interface for complex UserDocument search operations
 * Defines the contract for advanced Elasticsearch queries with security and filtering logic
 */
public interface UserSearchRepositoryCustom {

    /**
     * Find users filtered by status and search term
     * Used by admin users to filter and search through user accounts
     *
     * @param status Filter by account status (optional)
     * @param searchTerm Text search query across username and email (optional)
     * @param pageable Pagination and sorting parameters
     * @return Page of UserDocument matching the criteria
     */
    Page<UserDocument> findFilteredUsers(String status, String searchTerm, Pageable pageable);

    /**
     * Find users that can be tagged by the current user
     * Filters out blocked users, inactive users, and users with tagging disabled
     *
     * @param currentUserId ID of the authenticated user
     * @param blockedUserIds List of user IDs blocked by current user
     * @param blockedByUserIds List of user IDs who blocked current user
     * @param query Text search query across username and email (optional)
     * @param pageable Pagination and sorting parameters
     * @return Page of UserDocument that are taggable
     */
    Page<UserDocument> findTaggableUsers(Long currentUserId, List<Long> blockedUserIds, List<Long> blockedByUserIds, String query, Pageable pageable);

    /**
     * Find users by their IDs (used for fetching blocked users)
     *
     * @param blockedUserIds List of user IDs to fetch
     * @param pageable Pagination and sorting parameters
     * @return Page of UserDocument matching the IDs
     */
    Page<UserDocument> findBlockedUsersByIds(List<Long> blockedUserIds, Pageable pageable);

    /**
     * Find users by their IDs (used for fetching users who blocked current user)
     *
     * @param blockedByUserIds List of user IDs to fetch
     * @param pageable Pagination and sorting parameters
     * @return Page of UserDocument matching the IDs
     */
    Page<UserDocument> findBlockingUsersByIds(List<Long> blockedByUserIds, Pageable pageable);

    /**
     * Find personalized follow suggestions using Elasticsearch function_score query
     * Ranks users based on multiple factors:
     * - Friends of Friends: Users followed by people the target user follows (high weight)
     * - Interests: Users with shared interests (medium weight)
     * - Designation: Users with similar designation/profession (low weight)
     * - Popularity: Users with high follower counts (cold start boost)
     * - Recency: Recently active users (diversity boost)
     *
     * @param targetUserId ID of the user to generate suggestions for
     * @param exclusions Set of user IDs to exclude (self + already following)
     * @param blockedUserIds List of user IDs blocked by target user
     * @param blockedByUserIds List of user IDs who blocked target user
     * @param friendsOfFriendsIds Set of user IDs followed by target user's following
     * @param targetUserInterests List of category IDs the target user is interested in
     * @param targetUserDesignation Designation/profession of the target user
     * @param pageable Pagination and sorting parameters
     * @return Page of UserDocument ranked by relevance for follow suggestions
     */
    Page<UserDocument> findFollowSuggestions(
            Long targetUserId,
            Set<Long> exclusions,
            List<Long> blockedUserIds,
            List<Long> blockedByUserIds,
            Set<Long> friendsOfFriendsIds,
            List<Long> targetUserInterests,
            String targetUserDesignation,
            Pageable pageable
    );
}

