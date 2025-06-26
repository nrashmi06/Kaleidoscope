package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.users.dto.response.FollowListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.mapper.FollowMapper;
import com.kaleidoscope.backend.users.model.Follow;
import com.kaleidoscope.backend.users.model.UserBlock;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import com.kaleidoscope.backend.users.repository.UserBlockRepository;
import com.kaleidoscope.backend.users.service.FollowService;
import com.kaleidoscope.backend.users.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {

    private final JwtUtils jwtUtils;
    private final UserService userService;
    private final FollowRepository followRepository;
    private final FollowMapper followMapper;
    private final UserBlockRepository userBlockRepository;

    private Set<Long> getBlockedUserIds(Long currentUserId) {
        List<UserBlock> blockedByUser = userBlockRepository.findByBlocker_UserId(currentUserId);
        List<UserBlock> blockedUser = userBlockRepository.findByBlocked_UserId(currentUserId);

        return Stream.concat(
                blockedByUser.stream().map(b -> b.getBlocked().getUserId()),
                blockedUser.stream().map(b -> b.getBlocker().getUserId())
        ).collect(Collectors.toSet());
    }

    @Override
    @Transactional
    public void followUser(Long targetUserId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();

        // Prevent self-following
        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Users cannot follow themselves");
        }

        // Check if already following
        if (followRepository.findByFollower_UserIdAndFollowing_UserId(currentUserId, targetUserId).isPresent()) {
            throw new IllegalArgumentException("Already following this user");
        }

        Follow follow = Follow.builder()
                .follower(userService.getUserById(currentUserId))
                .following(userService.getUserById(targetUserId))
                .build();

        followRepository.save(follow);
    }

    @Override
    @Transactional
    public void unfollowUser(Long targetUserId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        Follow follow = followRepository.findByFollower_UserIdAndFollowing_UserId(currentUserId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Follow relationship not found"));

        followRepository.delete(follow);
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
        Set<Long> blockedUserIds = getBlockedUserIds(currentUserId);

        List<UserDetailsSummaryResponseDTO> followerDTOs = followers.getContent().stream()
                .filter(f -> !blockedUserIds.contains(f.getFollower().getUserId()))
                .map(followMapper::mapFollowerToUserSummary)
                .collect(Collectors.toList());

        return FollowListResponseDTO.builder()
                .users(followerDTOs)
                .currentPage(pageable.getPageNumber())
                .totalPages(followers.getTotalPages())
                .totalElements(followers.getTotalElements())
                .build();
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
        Set<Long> blockedUserIds = getBlockedUserIds(currentUserId);

        List<UserDetailsSummaryResponseDTO> followingDTOs = following.getContent().stream()
                .filter(f -> !blockedUserIds.contains(f.getFollowing().getUserId()))
                .map(followMapper::mapFollowingToUserSummary)
                .collect(Collectors.toList());

        return FollowListResponseDTO.builder()
                .users(followingDTOs)
                .currentPage(pageable.getPageNumber())
                .totalPages(following.getTotalPages())
                .totalElements(following.getTotalElements())
                .build();
    }

}