package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.document.UserDocument;
import com.kaleidoscope.backend.users.dto.response.FollowListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.enums.Visibility;
import com.kaleidoscope.backend.users.exception.follow.FollowRequestAlreadyExistsException;
import com.kaleidoscope.backend.users.exception.follow.FollowRequestNotFoundException;
import com.kaleidoscope.backend.users.exception.follow.SelfFollowNotAllowedException;
import com.kaleidoscope.backend.users.exception.follow.UserAlreadyFollowedException;
import com.kaleidoscope.backend.users.mapper.FollowMapper;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.users.model.*;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import com.kaleidoscope.backend.users.repository.FollowRequestRepository;
import com.kaleidoscope.backend.users.repository.UserBlockRepository;
import com.kaleidoscope.backend.users.repository.UserPreferencesRepository;
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

import java.util.*;
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
    private final FollowRequestRepository followRequestRepository;
    private final UserPreferencesRepository userPreferencesRepository;

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

    /**
     * Helper method to create a direct follow relationship with Elasticsearch sync
     */
    private Follow createDirectFollow(User follower, User following) {
        Follow follow = Follow.builder()
                .follower(follower)
                .following(following)
                .build();

        follow = followRepository.save(follow);

        // Sync to Elasticsearch
        userDocumentSyncService.syncOnFollowChange(follower.getUserId(), following.getUserId(), true);
        followDocumentSyncService.syncOnFollow(follow);

        log.info("Direct follow created: User {} is now following User {}", follower.getUserId(), following.getUserId());
        return follow;
    }

    /**
     * Helper method to create a follow request without Elasticsearch sync
     */
    private FollowRequest createFollowRequest(User requester, User requestee) {
        // Check if request already exists
        if (followRequestRepository.existsByRequester_UserIdAndRequestee_UserId(requester.getUserId(), requestee.getUserId())) {
            throw new FollowRequestAlreadyExistsException("Follow request already sent to this user");
        }

        FollowRequest followRequest = FollowRequest.builder()
                .requester(requester)
                .requestee(requestee)
                .build();

        followRequest = followRequestRepository.save(followRequest);

        // TODO: Send notification to requestee
        log.info("Follow request created: User {} sent follow request to User {}", requester.getUserId(), requestee.getUserId());
        return followRequest;
    }

    @Override
    @Transactional
    public String followUser(Long targetUserId) {
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

        // Get current user and target user
        User currentUser = userService.getUserById(currentUserId);
        User targetUser = userService.getUserById(targetUserId);

        // Fetch target user's preferences
        UserPreferences targetPreferences = userPreferencesRepository.findByUser_UserId(targetUserId)
                .orElseGet(() -> {
                    // Return default preferences if not found
                    UserPreferences defaultPrefs = new UserPreferences();
                    defaultPrefs.setProfileVisibility(Visibility.PUBLIC);
                    return defaultPrefs;
                });

        Visibility profileVisibility = targetPreferences.getProfileVisibility();

        // Handle based on profile visibility
        if (profileVisibility == Visibility.PUBLIC) {
            // Check if already following
            if (followRepository.existsByFollower_UserIdAndFollowing_UserId(currentUserId, targetUserId)) {
                throw new UserAlreadyFollowedException("Already following this user");
            }

            // Clean up any existing follow request (in case profile visibility changed from FRIENDS_ONLY to PUBLIC)
            followRequestRepository.deleteByRequester_UserIdAndRequestee_UserId(currentUserId, targetUserId);
            log.debug("Cleaned up any existing follow request from User {} to User {} before creating direct follow",
                    currentUserId, targetUserId);

            // Create direct follow relationship
            createDirectFollow(currentUser, targetUser);
            return "FOLLOWED"; // Immediate follow
        } else if (profileVisibility == Visibility.FRIENDS_ONLY) {
            // Check if already following (shouldn't happen, but safety check)
            if (followRepository.existsByFollower_UserIdAndFollowing_UserId(currentUserId, targetUserId)) {
                throw new UserAlreadyFollowedException("Already following this user");
            }
            // Create follow request
            createFollowRequest(currentUser, targetUser);
            return "REQUEST_SENT"; // Follow request created
        } else if (profileVisibility == Visibility.NO_ONE) {
            throw new IllegalStateException("This user is not accepting follow requests");
        }

        return "FOLLOWED"; // Default case
    }

    @Override
    @Transactional
    public void unfollowUser(Long targetUserId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();

        // Try to delete follow relationship
        Follow follow = followRepository.findByFollower_UserIdAndFollowing_UserId(currentUserId, targetUserId)
                .orElse(null);

        if (follow != null) {
            followRepository.delete(follow);

            // Sync to Elasticsearch
            userDocumentSyncService.syncOnFollowChange(currentUserId, targetUserId, false);
            followDocumentSyncService.syncOnUnfollow(currentUserId, targetUserId);
            log.info("User {} unfollowed User {}", currentUserId, targetUserId);
        }

        // Also delete any pending follow request
        followRequestRepository.deleteByRequester_UserIdAndRequestee_UserId(currentUserId, targetUserId);
        log.info("Deleted any pending follow request from User {} to User {}", currentUserId, targetUserId);
    }

    @Override
    @Transactional
    public void approveFollowRequest(Long requesterUserId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();

        // Find the follow request
        FollowRequest followRequest = followRequestRepository
                .findByRequester_UserIdAndRequestee_UserId(requesterUserId, currentUserId)
                .orElseThrow(() -> new FollowRequestNotFoundException("Follow request not found"));

        User requester = followRequest.getRequester();
        User requestee = followRequest.getRequestee();

        // Delete the request first
        followRequestRepository.delete(followRequest);

        // Check if follow relationship already exists (data inconsistency edge case)
        if (followRepository.existsByFollower_UserIdAndFollowing_UserId(requesterUserId, currentUserId)) {
            log.warn("Follow relationship already exists for User {} -> User {}. Skipping creation but request was deleted.",
                    requesterUserId, currentUserId);
            return;
        }

        // Create the follow relationship with ES sync
        createDirectFollow(requester, requestee);

        // TODO: Send notification to requester about approval
        log.info("Follow request approved: User {} approved request from User {}", currentUserId, requesterUserId);
    }

    @Override
    @Transactional
    public void rejectFollowRequest(Long requesterUserId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();

        // Find the follow request
        FollowRequest followRequest = followRequestRepository
                .findByRequester_UserIdAndRequestee_UserId(requesterUserId, currentUserId)
                .orElseThrow(() -> new FollowRequestNotFoundException("Follow request not found"));

        // Delete the request
        followRequestRepository.delete(followRequest);

        // TODO: Send notification to requester about rejection (optional)
        log.info("Follow request rejected: User {} rejected request from User {}", currentUserId, requesterUserId);
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
    public PaginatedResponse<UserDetailsSummaryResponseDTO> listPendingFollowRequests(Pageable pageable) {
        Long currentUserId = jwtUtils.getUserIdFromContext();

        // Fetch pending requests where current user is the requestee (receiver)
        Page<FollowRequest> requests = followRequestRepository
                .findByRequestee_UserIdOrderByCreatedAtDesc(currentUserId, pageable);

        // Map to UserDetailsSummaryResponseDTO (the requesters)
        Page<UserDetailsSummaryResponseDTO> requesterPage = requests.map(request ->
                UserMapper.toUserDetailsSummaryResponseDTO(request.getRequester())
        );

        return PaginatedResponse.fromPage(requesterPage);
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
