package com.kaleidoscope.backend.users.service;

import com.kaleidoscope.backend.users.dto.request.BlockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UnblockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.response.BlockStatusResponseDTO;
import com.kaleidoscope.backend.users.dto.response.BlockedUsersListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserBlockResponseDTO;
import com.kaleidoscope.backend.users.model.UserBlock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for user blocking operations
 */
public interface UserBlockService {

    /**
     * Block a user
     *
     * @param blockUserRequestDTO Request containing user to block
     * @return UserBlockResponseDTO
     */
    UserBlockResponseDTO blockUser(BlockUserRequestDTO blockUserRequestDTO);

    /**
     * Unblock a user
     *
     * @param unblockUserRequestDTO Request containing user to unblock
     * @return Success message
     */
    String unblockUser(UnblockUserRequestDTO unblockUserRequestDTO);

    /**
     * Get list of users blocked by current user
     *
     * @param pageable Pagination parameters
     * @return BlockedUsersListResponseDTO
     */
    BlockedUsersListResponseDTO getBlockedUsers(Pageable pageable);

    /**
     * Get list of users who blocked the current user
     *
     * @param pageable Pagination parameters
     * @return BlockedUsersListResponseDTO
     */
    BlockedUsersListResponseDTO getUsersWhoBlockedMe(Pageable pageable);

    /**
     * Check block status between current user and target user
     *
     * @param targetUserId Target user ID
     * @return BlockStatusResponseDTO
     */
    BlockStatusResponseDTO checkBlockStatus(Long targetUserId);

    /**
     * Admin: Get all blocks with pagination
     *
     * @param pageable Pagination parameters
     * @return Page of UserBlock entities
     */
    Page<UserBlock> getAllBlocks(Pageable pageable);

    /**
     * Admin: Remove a block relationship
     *
     * @param blockId Block ID to remove
     * @return Success message
     */
    String removeBlock(Long blockId);

    /**
     * Check if user A has blocked user B
     *
     * @param blockerUserId Blocker user ID
     * @param blockedUserId Blocked user ID
     * @return true if blocked, false otherwise
     */
    boolean isUserBlocked(Long blockerUserId, Long blockedUserId);
}
