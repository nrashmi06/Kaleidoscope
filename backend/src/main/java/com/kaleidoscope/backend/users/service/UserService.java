package com.kaleidoscope.backend.users.service;

import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileRequestDTO;
import com.kaleidoscope.backend.users.dto.response.UpdateUserProfileResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserProfileResponseDTO;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Service interface for user management operations
 */
public interface UserService {
    UserDetails loadUserByUsername(String username);
    /**
     * Retrieve a user by ID
     *
     * @param userId User ID
     * @return User entity
     */
    User getUserById(Long userId);

    /**
     * Retrieve a user by email
     *
     * @param email User email
     * @return User entity
     */
    User getUserByEmail(String email);

    /**
     * Retrieve users with filtering options
     *
     * @param status Account status filter
     * @param searchTerm Search term for user attributes
     * @param pageable Pagination parameters
     * @return Page of users
     */
    Page<UserDetailsSummaryResponseDTO> getUsersByFilters(String status, String searchTerm, Pageable pageable);

    /**
     * Update user's account status
     *
     * @param userId User ID
     * @param accountStatus New account status
     */
    void updateUserProfileStatus(Long userId, String accountStatus);

    /**
     * Update user profile information
     *
     * @param userId User ID
     * @param updateRequest Profile update data
     * @return Updated user profile response
     * @throws Exception If update fails
     */
    UpdateUserProfileResponseDTO updateUserProfile(Long userId, UpdateUserProfileRequestDTO updateRequest) throws Exception;

    /**
     * Check if username exists
     *
     * @param username Username to check
     * @return true if username exists
     */
    boolean existsByUsername(String username);

    /**
     * Check if email exists
     *
     * @param email Email to check
     * @return true if email exists
     */
    boolean existsByEmail(String email);

    /**
     * Get a user's profile information, gated by privacy settings.
     * This implementation MUST use Elasticsearch (UserDocument) for primary data.
     *
     * @param profileUserId The ID of the user whose profile is being viewed.
     * @param pageable Pagination for the user's posts.
     * @return UserProfileResponseDTO containing all necessary profile data.
     */
    UserProfileResponseDTO getUserProfile(Long profileUserId, Pageable pageable);
}