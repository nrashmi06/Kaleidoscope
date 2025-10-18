package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.document.UserDocument;
import com.kaleidoscope.backend.users.dto.response.FollowListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.exception.follow.FollowRelationshipNotFoundException;
import com.kaleidoscope.backend.users.exception.follow.SelfFollowNotAllowedException;
import com.kaleidoscope.backend.users.exception.follow.UserAlreadyFollowedException;
import com.kaleidoscope.backend.users.mapper.FollowMapper;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.users.model.Follow;
import com.kaleidoscope.backend.users.model.UserBlock;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import com.kaleidoscope.backend.users.repository.UserBlockRepository;
import com.kaleidoscope.backend.users.repository.search.UserSearchRepository;
import com.kaleidoscope.backend.users.service.FollowDocumentSyncService;
import com.kaleidoscope.backend.users.service.FollowService;
import com.kaleidoscope.backend.users.service.UserDocumentSyncService;
import com.kaleidoscope.backend.users.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowServiceImpl implements FollowService {

    private final JwtUtils jwtUtils;
    private final UserService userService;
    private final FollowRepository followRepository;
    private final FollowMapper followMapper;
    private final UserBlockRepository userBlockRepository;
    private final UserDocumentSyncService userDocumentSyncService;
    private final FollowDocumentSyncService followDocumentSyncService;
    private final UserSearchRepository userSearchRepository;

    /**
     * Get users that the current user has blocked (unidirectional blocking)
     * Only returns users that currentUser has blocked, not users who blocked currentUser
     */
    private Set<Long> getBlockedByCurrentUserIds(Long currentUserId) {
        List<UserBlock> blockedByUser = userBlockRepository.findByBlocker_UserId(currentUserId);
        return blockedByUser.stream()
                .map(b -> b.getBlocked().getUserId())
                .collect(Collectors.toSet());
    }

    /**
     * Get users who have blocked the current user
     * This is separate from users the current user has blocked
     */
    private Set<Long> getUsersWhoBlockedCurrentUser(Long currentUserId) {
        List<UserBlock> blockedUser = userBlockRepository.findByBlocked_UserId(currentUserId);
        return blockedUser.stream()
                .map(b -> b.getBlocker().getUserId())
                .collect(Collectors.toSet());
    }

    @Override
    @Transactional
    public void followUser(Long targetUserId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();

        // Prevent self-following
        if (currentUserId.equals(targetUserId)) {
            throw new SelfFollowNotAllowedException("Users cannot follow themselves");
        }

        // Check if either user has blocked the other
        boolean isBlocked = userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(currentUserId, targetUserId).isPresent();
        boolean isBlockedBy = userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(targetUserId, currentUserId).isPresent();

        if (isBlocked || isBlockedBy) {
            throw new IllegalStateException("Cannot follow user due to blocking relationship");
        }

        // Check if already following
        if (followRepository.findByFollower_UserIdAndFollowing_UserId(currentUserId, targetUserId).isPresent()) {
            throw new UserAlreadyFollowedException("Already following this user");
        }

        Follow follow = Follow.builder()
                .follower(userService.getUserById(currentUserId))
                .following(userService.getUserById(targetUserId))
                .build();

        follow = followRepository.save(follow);

        // Sync to Elasticsearch
        userDocumentSyncService.syncOnFollowChange(currentUserId, targetUserId, true);
        followDocumentSyncService.syncOnFollow(follow);
    }

    @Override
    @Transactional
    public void unfollowUser(Long targetUserId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        Follow follow = followRepository.findByFollower_UserIdAndFollowing_UserId(currentUserId, targetUserId)
                .orElseThrow(() -> new FollowRelationshipNotFoundException("Follow relationship not found"));

        followRepository.delete(follow);

        // Sync to Elasticsearch
        userDocumentSyncService.syncOnFollowChange(currentUserId, targetUserId, false);
        followDocumentSyncService.syncOnUnfollow(currentUserId, targetUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public FollowListResponseDTO getFollowers(Long userId, Pageable pageable) {
        // Verify user exists
        userService.getUserById(userId);

        boolean isAdmin = jwtUtils.getRoleFromContext().equals(Role.ADMIN);
        Page<Follow> followers;

        if (isAdmin) {
            followers = followRepository.findByFollowing_UserId(userId, pageable);
        } else {
            followers = followRepository.findByFollowing_UserIdAndFollower_AccountStatus(userId, AccountStatus.ACTIVE, pageable);
        }

        Long currentUserId = jwtUtils.getUserIdFromContext();
        Set<Long> blockedUserIds = getBlockedByCurrentUserIds(currentUserId);

        List<UserDetailsSummaryResponseDTO> followerDTOs = followers.getContent().stream()
                .filter(f -> !blockedUserIds.contains(f.getFollower().getUserId()))
                .map(followMapper::mapFollowerToUserSummary)
                .collect(Collectors.toList());

        return new FollowListResponseDTO(
                followerDTOs,
                pageable.getPageNumber(),
                followers.getTotalPages(),
                followers.getTotalElements()
        );
    }


    @Override
    @Transactional(readOnly = true)
    public FollowListResponseDTO getFollowing(Long userId, Pageable pageable) {
        // Verify user exists
        userService.getUserById(userId);

        boolean isAdmin = jwtUtils.getRoleFromContext().equals(Role.ADMIN);
        Page<Follow> following;

        if (isAdmin) {
            following = followRepository.findByFollower_UserId(userId, pageable);
        } else {
            following = followRepository.findByFollower_UserIdAndFollowing_AccountStatus(userId, AccountStatus.ACTIVE, pageable);
        }

        Long currentUserId = jwtUtils.getUserIdFromContext();
        Set<Long> blockedUserIds = getBlockedByCurrentUserIds(currentUserId);

        List<UserDetailsSummaryResponseDTO> followingDTOs = following.getContent().stream()
                .filter(f -> !blockedUserIds.contains(f.getFollowing().getUserId()))
                .map(followMapper::mapFollowingToUserSummary)
                .collect(Collectors.toList());

        return new FollowListResponseDTO(
                followingDTOs,
                pageable.getPageNumber(),
                following.getTotalPages(),
                following.getTotalElements()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<UserDetailsSummaryResponseDTO> getFollowSuggestions(Long userId, Pageable pageable) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        Long targetUserId = (userId == null) ? currentUserId : userId;

        // Security Check: Only admins can view suggestions for other users
        if (!targetUserId.equals(currentUserId) && !jwtUtils.isAdminFromContext()) {
            throw new AccessDeniedException("You are not authorized to view suggestions for this user.");
        }

        try {
            // --- 1. Gather Inputs ---
            log.debug("Fetching UserDocument for target user {}", targetUserId);
            UserDocument targetUserDoc = userSearchRepository.findById(targetUserId.toString()).orElse(null);
            if (targetUserDoc == null) {
                log.warn("UserDocument not found for target user {}, cannot generate suggestions.", targetUserId);
                return PaginatedResponse.fromPage(Page.empty(pageable));
            }

            List<Long> targetUserInterests = targetUserDoc.getInterests();
            String targetUserDesignation = targetUserDoc.getDesignation();

            // Fetch blocking information from UserDocument
            List<Long> blockedUserIds = targetUserDoc.getBlockedUserIds() != null ? targetUserDoc.getBlockedUserIds() : new ArrayList<>();
            List<Long> blockedByUserIds = targetUserDoc.getBlockedByUserIds() != null ? targetUserDoc.getBlockedByUserIds() : new ArrayList<>();

            log.debug("Target user {} has blocked {} users and is blocked by {} users",
                targetUserId, blockedUserIds.size(), blockedByUserIds.size());

            Set<Long> alreadyFollowingIds = followRepository.findFollowingIdsByFollowerId(targetUserId);
            Set<Long> exclusions = new HashSet<>(alreadyFollowingIds);
            exclusions.add(targetUserId);

            Set<Long> friendsOfFriendsIds = alreadyFollowingIds.isEmpty() ? Collections.emptySet()
                    : followRepository.findFollowingIdsByFollowerIds(alreadyFollowingIds);

            // Use custom repository method
            Page<UserDocument> userDocumentPage = userSearchRepository.findFollowSuggestions(
                    targetUserId,
                    exclusions,
                    blockedUserIds,
                    blockedByUserIds,
                    friendsOfFriendsIds,
                    targetUserInterests,
                    targetUserDesignation,
                    pageable
            );

            // Map to DTOs
            Page<UserDetailsSummaryResponseDTO> dtoPage = userDocumentPage.map(UserMapper::toUserDetailsSummaryResponseDTO);

            log.info("Returned {} suggestions using custom repository for user {}", userDocumentPage.getNumberOfElements(), targetUserId);
            return PaginatedResponse.fromPage(dtoPage);

        } catch (Exception e) {
            log.error("Error generating follow suggestions for user {}: {}", targetUserId, e.getMessage(), e);
            return PaginatedResponse.fromPage(Page.empty(pageable));
        }
    }

}
