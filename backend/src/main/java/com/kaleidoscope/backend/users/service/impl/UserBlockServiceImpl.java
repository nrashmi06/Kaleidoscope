package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.users.dto.request.BlockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UnblockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.response.BlockStatusResponseDTO;
import com.kaleidoscope.backend.users.dto.response.BlockedUsersListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserBlockResponseDTO;
import com.kaleidoscope.backend.users.exception.userblock.UserBlockNotFoundException;
import com.kaleidoscope.backend.users.mapper.UserBlockEntityMapper;
import com.kaleidoscope.backend.users.mapper.UserBlockMapper;
import com.kaleidoscope.backend.users.mapper.UserBlockPaginationMapper;
import com.kaleidoscope.backend.users.mapper.UserBlockStatusMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserBlock;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import com.kaleidoscope.backend.users.repository.UserBlockRepository;
import com.kaleidoscope.backend.users.service.UserBlockService;
import com.kaleidoscope.backend.users.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserBlockServiceImpl implements UserBlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserService userService;
    private final JwtUtils jwtUtils;
    private final UserBlockMapper userBlockMapper;
    private final UserBlockEntityMapper entityMapper;
    private final UserBlockPaginationMapper paginationMapper;
    private final UserBlockStatusMapper statusMapper;
    private final FollowRepository followRepository; // Add this dependency

    @Override
    public UserBlockResponseDTO blockUser(BlockUserRequestDTO blockUserRequestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        Long userIdToBlock = blockUserRequestDTO.getUserIdToBlock();

        log.info("User {} attempting to block user {}", currentUserId, userIdToBlock);

        // Use mapper for validation
        entityMapper.validateNotSelfBlock(currentUserId, userIdToBlock);

        // Get users
        User blocker = userService.getUserById(currentUserId);
        User userToBlock = userService.getUserById(userIdToBlock);

        // Use repository method with unique constraint to prevent race conditions
        try {
            // Use mapper to create block entity
            UserBlock userBlock = entityMapper.buildUserBlock(blocker, userToBlock);
            UserBlock savedBlock = userBlockRepository.save(userBlock);

            // Auto-unfollow: Remove any existing follow relationships in both directions
            followRepository.findByFollower_UserIdAndFollowing_UserId(currentUserId, userIdToBlock)
                    .ifPresent(followRepository::delete);
            followRepository.findByFollower_UserIdAndFollowing_UserId(userIdToBlock, currentUserId)
                    .ifPresent(followRepository::delete);

            log.info("User {} successfully blocked user {} and removed follow relationships", currentUserId, userIdToBlock);
            return userBlockMapper.toUserBlockResponseDTO(savedBlock);

        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Handle unique constraint violation (race condition)
            throw new com.kaleidoscope.backend.users.exception.userblock.UserAlreadyBlockedException(currentUserId, userIdToBlock);
        }
    }

    @Override
    public String unblockUser(UnblockUserRequestDTO unblockUserRequestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        Long userIdToUnblock = unblockUserRequestDTO.getUserIdToUnblock();

        log.info("User {} attempting to unblock user {}", currentUserId, userIdToUnblock);

        // Use mapper to get existing block or throw exception
        Optional<UserBlock> blockOptional = userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(currentUserId, userIdToUnblock);
        UserBlock userBlock = entityMapper.getExistingBlockOrThrow(blockOptional, currentUserId, userIdToUnblock);

        userBlockRepository.delete(userBlock);
        log.info("User {} successfully unblocked user {}", currentUserId, userIdToUnblock);

        return "User successfully unblocked";
    }

    @Override
    @Transactional(readOnly = true)
    public BlockedUsersListResponseDTO getBlockedUsers(Pageable pageable) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Getting blocked users for user {}", currentUserId);

        Page<UserBlock> blockedUsersPage = userBlockRepository.findByBlocker_UserIdWithBlocked(currentUserId, pageable);

        // Use pagination mapper to eliminate duplication
        return paginationMapper.buildBlockedUsersResponse(blockedUsersPage, UserBlockPaginationMapper::extractBlockedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public BlockedUsersListResponseDTO getUsersWhoBlockedMe(Pageable pageable) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Getting users who blocked user {}", currentUserId);

        Page<UserBlock> blockersPage = userBlockRepository.findByBlocked_UserIdWithBlocker(currentUserId, pageable);

        // Use pagination mapper to eliminate duplication
        return paginationMapper.buildBlockedUsersResponse(blockersPage, UserBlockPaginationMapper::extractBlockerUser);
    }

    @Override
    @Transactional(readOnly = true)
    public BlockStatusResponseDTO checkBlockStatus(Long targetUserId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Checking block status between user {} and user {}", currentUserId, targetUserId);

        // Single optimized query to check both directions at once
        List<UserBlock> blocks = userBlockRepository.findBlocksBetweenUsers(currentUserId, targetUserId);

        // Use status mapper to analyze blocks and build response
        return statusMapper.buildBlockStatusResponse(blocks, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserBlock> getAllBlocks(Pageable pageable) {
        log.info("Admin getting all blocks with pagination");
        return userBlockRepository.findAllWithBlockerAndBlocked(pageable);
    }

    @Override
    public String removeBlock(Long blockId) {
        log.info("Admin removing block with ID {}", blockId);

        UserBlock userBlock = userBlockRepository.findById(blockId)
                .orElseThrow(() -> new UserBlockNotFoundException("Block not found with ID: " + blockId));

        userBlockRepository.delete(userBlock);
        log.info("Block with ID {} successfully removed by admin", blockId);

        return "Block relationship successfully removed";
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserBlocked(Long blockerUserId, Long blockedUserId) {
        return userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(blockerUserId, blockedUserId).isPresent();
    }
}
