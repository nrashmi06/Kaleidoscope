package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.users.document.UserDocument;
import com.kaleidoscope.backend.users.dto.request.BlockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UnblockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.response.BlockStatusResponseDTO;
import com.kaleidoscope.backend.users.dto.response.BlockedUsersListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserBlockResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.exception.userblock.UserBlockNotFoundException;
import com.kaleidoscope.backend.users.mapper.*;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserBlock;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import com.kaleidoscope.backend.users.repository.UserBlockRepository;
import com.kaleidoscope.backend.users.repository.search.UserSearchRepository;
import com.kaleidoscope.backend.users.service.UserBlockService;
import com.kaleidoscope.backend.users.service.UserDocumentSyncService;
import com.kaleidoscope.backend.users.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    private final FollowRepository followRepository;
    private final UserDocumentSyncService userDocumentSyncService;
    private final UserSearchRepository userSearchRepository;

    @Override
    public UserBlockResponseDTO blockUser(BlockUserRequestDTO blockUserRequestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        Long userIdToBlock = blockUserRequestDTO.userIdToBlock();

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

            // Sync Elasticsearch UserDocument with block information
            userDocumentSyncService.syncOnBlockChange(currentUserId, userIdToBlock, true);

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
        Long userIdToUnblock = unblockUserRequestDTO.userIdToUnblock();

        log.info("User {} attempting to unblock user {}", currentUserId, userIdToUnblock);

        // Use mapper to get existing block or throw exception
        Optional<UserBlock> blockOptional = userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(currentUserId, userIdToUnblock);
        UserBlock userBlock = entityMapper.getExistingBlockOrThrow(blockOptional, currentUserId, userIdToUnblock);

        userBlockRepository.delete(userBlock);

        // Sync Elasticsearch UserDocument with unblock information
        userDocumentSyncService.syncOnBlockChange(currentUserId, userIdToUnblock, false);

        log.info("User {} successfully unblocked user {}", currentUserId, userIdToUnblock);

        return "User successfully unblocked";
    }

    @Override
    @Transactional(readOnly = true)
    public BlockedUsersListResponseDTO getBlockedUsers(Pageable pageable) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Getting blocked users for user {} using Elasticsearch", currentUserId);

        try {
            // Fetch UserDocument for current user from Elasticsearch
            Optional<UserDocument> userDocOpt = userSearchRepository.findById(currentUserId.toString());

            if (userDocOpt.isEmpty()) {
                log.warn("UserDocument not found for user {} in Elasticsearch, returning empty list", currentUserId);
                return new BlockedUsersListResponseDTO(new ArrayList<>(), pageable.getPageNumber(), 0, 0L);
            }

            UserDocument currentUserDoc = userDocOpt.get();
            List<Long> blockedUserIds = currentUserDoc.getBlockedUserIds();

            // If no blocked users, return empty response
            if (blockedUserIds == null || blockedUserIds.isEmpty()) {
                log.debug("User {} has not blocked any users", currentUserId);
                return new BlockedUsersListResponseDTO(new ArrayList<>(), pageable.getPageNumber(), 0, 0L);
            }

            log.debug("User {} has blocked {} users, querying Elasticsearch", currentUserId, blockedUserIds.size());

            // Use custom repository method
            Page<UserDocument> userDocumentPage = userSearchRepository.findBlockedUsersByIds(blockedUserIds, pageable);

            // Map to DTOs
            List<UserDetailsSummaryResponseDTO> blockedUsers = userDocumentPage.getContent().stream()
                    .map(UserMapper::toUserDetailsSummaryResponseDTO)
                    .collect(Collectors.toList());

            long totalElements = userDocumentPage.getTotalElements();
            int totalPages = userDocumentPage.getTotalPages();

            log.info("Retrieved {} blocked users for user {} (page {}/{})",
                    blockedUsers.size(), currentUserId, pageable.getPageNumber(), totalPages);

            return new BlockedUsersListResponseDTO(
                    blockedUsers,
                    pageable.getPageNumber(),
                    totalPages,
                    totalElements
            );

        } catch (Exception e) {
            log.error("Error retrieving blocked users for user {} from Elasticsearch: {}",
                    currentUserId, e.getMessage(), e);
            // Return empty response on error
            return new BlockedUsersListResponseDTO(new ArrayList<>(), pageable.getPageNumber(), 0, 0L);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public BlockedUsersListResponseDTO getUsersWhoBlockedMe(Pageable pageable) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Getting users who blocked user {} using Elasticsearch", currentUserId);

        try {
            // Fetch UserDocument for current user from Elasticsearch
            Optional<UserDocument> userDocOpt = userSearchRepository.findById(currentUserId.toString());

            if (userDocOpt.isEmpty()) {
                log.warn("UserDocument not found for user {} in Elasticsearch, returning empty list", currentUserId);
                return new BlockedUsersListResponseDTO(new ArrayList<>(), pageable.getPageNumber(), 0, 0L);
            }

            UserDocument currentUserDoc = userDocOpt.get();
            List<Long> blockedByUserIds = currentUserDoc.getBlockedByUserIds();

            // If no users have blocked current user, return empty response
            if (blockedByUserIds == null || blockedByUserIds.isEmpty()) {
                log.debug("No users have blocked user {}", currentUserId);
                return new BlockedUsersListResponseDTO(new ArrayList<>(), pageable.getPageNumber(), 0, 0L);
            }

            log.debug("User {} is blocked by {} users, querying Elasticsearch", currentUserId, blockedByUserIds.size());

            // Use custom repository method
            Page<UserDocument> userDocumentPage = userSearchRepository.findBlockingUsersByIds(blockedByUserIds, pageable);

            // Map to DTOs
            List<UserDetailsSummaryResponseDTO> blockerUsers = userDocumentPage.getContent().stream()
                    .map(UserMapper::toUserDetailsSummaryResponseDTO)
                    .collect(Collectors.toList());

            long totalElements = userDocumentPage.getTotalElements();
            int totalPages = userDocumentPage.getTotalPages();

            log.info("Retrieved {} users who blocked user {} (page {}/{})",
                    blockerUsers.size(), currentUserId, pageable.getPageNumber(), totalPages);

            return new BlockedUsersListResponseDTO(
                    blockerUsers,
                    pageable.getPageNumber(),
                    totalPages,
                    totalElements
            );

        } catch (Exception e) {
            log.error("Error retrieving users who blocked user {} from Elasticsearch: {}",
                    currentUserId, e.getMessage(), e);
            // Return empty response on error
            return new BlockedUsersListResponseDTO(new ArrayList<>(), pageable.getPageNumber(), 0, 0L);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public BlockStatusResponseDTO checkBlockStatus(Long targetUserId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Checking block status between user {} and user {} using Elasticsearch", currentUserId, targetUserId);

        try {
            // Fetch UserDocument for current user from Elasticsearch
            Optional<UserDocument> userDocOpt = userSearchRepository.findById(currentUserId.toString());

            if (userDocOpt.isEmpty()) {
                log.warn("UserDocument not found for user {} in Elasticsearch, returning default false status", currentUserId);
                return new BlockStatusResponseDTO(false, false, null);
            }

            UserDocument currentUserDoc = userDocOpt.get();

            // Check if current user has blocked target user
            List<Long> blockedUserIds = currentUserDoc.getBlockedUserIds();
            boolean isBlocked = blockedUserIds != null && blockedUserIds.contains(targetUserId);

            // Check if target user has blocked current user
            List<Long> blockedByUserIds = currentUserDoc.getBlockedByUserIds();
            boolean isBlockedBy = blockedByUserIds != null && blockedByUserIds.contains(targetUserId);

            log.info("Block status for user {} and target {}: isBlocked={}, isBlockedBy={}",
                    currentUserId, targetUserId, isBlocked, isBlockedBy);

            // Return status without blockId (not readily available from Elasticsearch)
            return new BlockStatusResponseDTO(isBlocked, isBlockedBy, null);

        } catch (Exception e) {
            log.error("Error checking block status for user {} and target {} from Elasticsearch: {}",
                    currentUserId, targetUserId, e.getMessage(), e);
            // Return default false status on error
            return new BlockStatusResponseDTO(false, false, null);
        }
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

        // Store blocker and blocked IDs before deleting
        Long blockerId = userBlock.getBlocker().getUserId();
        Long blockedId = userBlock.getBlocked().getUserId();

        userBlockRepository.delete(userBlock);

        // Sync Elasticsearch UserDocument with unblock information
        userDocumentSyncService.syncOnBlockChange(blockerId, blockedId, false);

        log.info("Block with ID {} successfully removed by admin", blockId);

        return "Block relationship successfully removed";
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserBlocked(Long blockerUserId, Long blockedUserId) {
        return userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(blockerUserId, blockedUserId).isPresent();
    }
}

