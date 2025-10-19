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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.query_dsl.*;

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
    private final ElasticsearchTemplate elasticsearchTemplate;
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

            // --- 2. Build the Function Score Query ---
            List<FunctionScore.Builder> functions = new ArrayList<>();

            // Function 1: Followers of Followers (Weight: 10.0)
            log.debug("Adding Friends-of-Friends scoring function with {} candidates", friendsOfFriendsIds.size());
            if (!friendsOfFriendsIds.isEmpty()) {
                functions.add(new FunctionScore.Builder()
                    .filter(TermsQuery.of(t -> t
                        .field("userId")
                        .terms(ts -> ts.value(friendsOfFriendsIds.stream().map(FieldValue::of).collect(Collectors.toList())))
                    )._toQuery())
                    .weight(10.0)
                );
            }

            // Function 2: Shared Interests (Weight: 5.0)
            log.debug("Adding Interest-based scoring function");
            if (targetUserInterests != null && !targetUserInterests.isEmpty()) {
                functions.add(new FunctionScore.Builder()
                    .filter(TermsQuery.of(t -> t
                        .field("interests")
                        .terms(ts -> ts.value(targetUserInterests.stream().map(FieldValue::of).collect(Collectors.toList())))
                    )._toQuery())
                    .weight(5.0)
                );
            }

            // Function 3: Similar Designation (Weight: 2.0)
            log.debug("Adding Designation-based scoring function");
            if (targetUserDesignation != null && !targetUserDesignation.isBlank()) {
                functions.add(new FunctionScore.Builder()
                    .filter(MatchQuery.of(m -> m
                        .field("designation")
                        .query(targetUserDesignation)
                    )._toQuery())
                    .weight(2.0)
                );
            }

            // Function 4: Popularity Boost for Cold Start (Follower Count)
            // Helps new users or users with few connections by gently boosting popular users
            // Using an exists query to boost users who have follower count data
            log.debug("Adding Follower Count boost for cold start scenarios");
            functions.add(new FunctionScore.Builder()
                .filter(ExistsQuery.of(e -> e
                    .field("followerCount")
                )._toQuery())
                .weight(0.75)  // Small weight to provide gentle boost without overriding main signals
            );

            // Function 5: Recently Active Users Boost (for Diversity)
            // Boosts users who have been seen recently to promote diverse, engaged suggestions
            log.debug("Adding Recent Activity boost for diversity");
            functions.add(new FunctionScore.Builder()
                .filter(ExistsQuery.of(e -> e
                    .field("lastSeen")
                )._toQuery())
                .weight(1.5)  // Moderate weight to influence but not dominate
            );

            // Build main query with blocking filters
            log.debug("Building main query with blocking filters");
            BoolQuery.Builder mainQueryBuilder = new BoolQuery.Builder()
                // Filter for ACTIVE users only
                .must(TermQuery.of(t -> t
                    .field("accountStatus")
                    .value(AccountStatus.ACTIVE.name())
                )._toQuery())
                // Exclude already followed users and self
                .mustNot(TermsQuery.of(t -> t
                    .field("userId")
                    .terms(ts -> ts.value(exclusions.stream().map(FieldValue::of).collect(Collectors.toList())))
                )._toQuery());

            // Exclude users blocked by target user
            if (!blockedUserIds.isEmpty()) {
                log.debug("Adding filter to exclude {} users blocked by target user", blockedUserIds.size());
                mainQueryBuilder.mustNot(TermsQuery.of(t -> t
                    .field("userId")
                    .terms(ts -> ts.value(blockedUserIds.stream().map(FieldValue::of).collect(Collectors.toList())))
                )._toQuery());
            }

            // Exclude users who have blocked the target user
            if (!blockedByUserIds.isEmpty()) {
                log.debug("Adding filter to exclude {} users who blocked target user", blockedByUserIds.size());
                mainQueryBuilder.mustNot(TermsQuery.of(t -> t
                    .field("userId")
                    .terms(ts -> ts.value(blockedByUserIds.stream().map(FieldValue::of).collect(Collectors.toList())))
                )._toQuery());
            }

            Query mainQuery = mainQueryBuilder.build()._toQuery();

            FunctionScoreQuery functionScoreQuery = FunctionScoreQuery.of(fs -> fs
                .query(mainQuery)
                .functions(functions.stream().map(FunctionScore.Builder::build).collect(Collectors.toList()))
                .scoreMode(FunctionScoreMode.Sum)  // Sum all function scores for comprehensive ranking
            );

            // --- 3. Execute and Return ---
            log.debug("Executing Elasticsearch query for user {} with {} scoring functions", targetUserId, functions.size());
            NativeQuery nativeQuery = NativeQuery.builder()
                    .withQuery(functionScoreQuery._toQuery())
                    .withPageable(pageable)
                    .build();

            SearchHits<UserDocument> searchHits = elasticsearchTemplate.search(nativeQuery, UserDocument.class);

            List<UserDocument> userDocuments = searchHits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());

            log.info("Returned {} suggestions for user {}", userDocuments.size(), targetUserId);

            Page<UserDocument> userDocumentPage = new PageImpl<>(userDocuments, pageable, searchHits.getTotalHits());
            Page<UserDetailsSummaryResponseDTO> dtoPage = userDocumentPage.map(UserMapper::toUserDetailsSummaryResponseDTO);

            return PaginatedResponse.fromPage(dtoPage);

        } catch (Exception e) {
            log.error("Error generating follow suggestions for user {}: {}", targetUserId, e.getMessage(), e);
            return PaginatedResponse.fromPage(Page.empty(pageable));
        }
    }

}
