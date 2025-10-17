package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.users.document.UserDocument;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserInterest;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import com.kaleidoscope.backend.users.repository.UserInterestRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.users.repository.UserBlockRepository;
import com.kaleidoscope.backend.users.repository.search.UserSearchRepository;
import com.kaleidoscope.backend.users.service.UserDocumentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class UserDocumentSyncServiceImpl implements UserDocumentSyncService {

    private final UserSearchRepository userSearchRepository;
    private final UserRepository userRepository;
    private final UserInterestRepository userInterestRepository;
    private final FollowRepository followRepository;
    private final UserBlockRepository userBlockRepository;

    @Override
    @Transactional
    public void syncOnUserCreation(User user) {
        try {
            log.info("Syncing UserDocument on creation for user ID: {}", user.getUserId());

            UserDocument userDocument = UserDocument.builder()
                    .id(user.getUserId().toString())
                    .userId(user.getUserId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .designation(user.getDesignation())
                    .summary(user.getSummary())
                    .profilePictureUrl(user.getProfilePictureUrl())
                    .coverPhotoUrl(user.getCoverPhotoUrl())
                    .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null)
                    .role(user.getRole() != null ? user.getRole().name() : null)
                    .isVerified(user.getIsVerified())
                    .followerCount(0)  // Initialize to 0 for new users
                    .followingCount(0)  // Initialize to 0 for new users
                    .interests(new ArrayList<>())  // Initialize empty list
                    .blockedUserIds(new ArrayList<>())  // Initialize empty list
                    .blockedByUserIds(new ArrayList<>())  // Initialize empty list
                    .faceEmbedding(null)  // Will be updated later by ML service
                    .createdAt(user.getCreatedAt())
                    .lastSeen(user.getLastSeen())
                    .build();

            userSearchRepository.save(userDocument);
            log.info("Successfully synced UserDocument for newly created user ID: {}", user.getUserId());
        } catch (Exception e) {
            log.error("Failed to sync UserDocument on creation for user ID: {}", user.getUserId(), e);
            // Don't throw exception - we don't want to break user registration if ES fails
        }
    }

    @Override
    @Transactional
    public void syncOnProfileUpdate(Long userId) {
        try {
            log.info("Syncing UserDocument on profile update for user ID: {}", userId);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

            Optional<UserDocument> existingDocOpt = userSearchRepository.findById(userId.toString());

            UserDocument userDocument;
            if (existingDocOpt.isPresent()) {
                // Update existing document
                userDocument = existingDocOpt.get();
                userDocument.setUsername(user.getUsername());
                userDocument.setEmail(user.getEmail());
                userDocument.setDesignation(user.getDesignation());
                userDocument.setSummary(user.getSummary());
                userDocument.setProfilePictureUrl(user.getProfilePictureUrl());
                userDocument.setCoverPhotoUrl(user.getCoverPhotoUrl());
                userDocument.setAccountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null);
                userDocument.setRole(user.getRole() != null ? user.getRole().name() : null);
                userDocument.setIsVerified(user.getIsVerified());
                userDocument.setLastSeen(user.getLastSeen());
            } else {
                // Create new document if it doesn't exist
                log.warn("UserDocument not found for user ID: {}, creating new document", userId);
                userDocument = buildCompleteUserDocument(user);
            }

            userSearchRepository.save(userDocument);
            log.info("Successfully synced UserDocument on profile update for user ID: {}", userId);
        } catch (Exception e) {
            log.error("Failed to sync UserDocument on profile update for user ID: {}", userId, e);
            // Don't throw exception - we don't want to break profile update if ES fails
        }
    }

    @Override
    @Transactional
    public void syncOnFollowChange(Long followerId, Long followingId, boolean isFollow) {
        try {
            log.info("Syncing UserDocument on follow change: follower={}, following={}, isFollow={}",
                    followerId, followingId, isFollow);

            int increment = isFollow ? 1 : -1;

            // Update follower's followingCount (incremental)
            updateFollowingCountIncremental(followerId, increment);

            // Update followed user's followerCount (incremental)
            updateFollowerCountIncremental(followingId, increment);

            log.info("Successfully synced UserDocument on follow change for users {} and {}", followerId, followingId);
        } catch (Exception e) {
            log.error("Failed to sync UserDocument on follow change for follower {} and following {}",
                    followerId, followingId, e);
            // Don't throw exception - we don't want to break follow/unfollow if ES fails
        }
    }

    @Override
    @Transactional
    public void syncOnInterestChange(Long userId) {
        try {
            log.info("Syncing UserDocument on interest change for user ID: {}", userId);

            Optional<UserDocument> existingDocOpt = userSearchRepository.findById(userId.toString());

            if (existingDocOpt.isPresent()) {
                UserDocument userDocument = existingDocOpt.get();

                // Fetch updated interests from PostgreSQL
                List<UserInterest> userInterests = userInterestRepository
                        .findByUser_UserId(userId, Pageable.unpaged())
                        .getContent();

                List<Long> categoryIds = userInterests.stream()
                        .map(interest -> interest.getCategory().getCategoryId())
                        .collect(Collectors.toList());

                userDocument.setInterests(categoryIds);
                userSearchRepository.save(userDocument);

                log.info("Successfully synced UserDocument interests for user ID: {} with {} interests",
                        userId, categoryIds.size());
            } else {
                log.warn("UserDocument not found for user ID: {} during interest sync, creating full document", userId);
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
                UserDocument newDocument = buildCompleteUserDocument(user);
                userSearchRepository.save(newDocument);
            }
        } catch (Exception e) {
            log.error("Failed to sync UserDocument on interest change for user ID: {}", userId, e);
            // Don't throw exception - we don't want to break interest updates if ES fails
        }
    }

    @Override
    @Transactional
    public void syncOnFaceEmbeddingGeneration(Long userId, float[] faceEmbedding) {
        try {
            log.info("Syncing UserDocument on face embedding generation for user ID: {}", userId);

            Optional<UserDocument> existingDocOpt = userSearchRepository.findById(userId.toString());

            if (existingDocOpt.isPresent()) {
                UserDocument userDocument = existingDocOpt.get();
                userDocument.setFaceEmbedding(faceEmbedding);
                userSearchRepository.save(userDocument);

                log.info("Successfully synced face embedding for user ID: {} with vector size: {}",
                        userId, faceEmbedding != null ? faceEmbedding.length : 0);
            } else {
                log.warn("UserDocument not found for user ID: {} during face embedding sync, creating full document", userId);
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
                UserDocument newDocument = buildCompleteUserDocument(user);
                newDocument.setFaceEmbedding(faceEmbedding);
                userSearchRepository.save(newDocument);
            }
        } catch (Exception e) {
            log.error("Failed to sync UserDocument on face embedding generation for user ID: {}", userId, e);
            // Don't throw exception - we don't want to break ML processing if ES fails
        }
    }

    @Override
    @Transactional
    public void syncOnBlockChange(Long blockerId, Long blockedId, boolean isBlock) {
        try {
            log.info("Syncing UserDocument on block change: blocker={}, blocked={}, isBlock={}",
                    blockerId, blockedId, isBlock);

            // Update blocker's document (add/remove blockedId from blockedUserIds)
            updateBlockedUsersList(blockerId, blockedId, isBlock);

            // Update blocked user's document (add/remove blockerId from blockedByUserIds)
            updateBlockedByUsersList(blockedId, blockerId, isBlock);

            log.info("Successfully synced UserDocument on block change for users {} and {}", blockerId, blockedId);
        } catch (Exception e) {
            log.error("Failed to sync UserDocument on block change for blocker {} and blocked {}",
                    blockerId, blockedId, e);
            // Don't throw exception - we don't want to break block/unblock if ES fails
        }
    }

    // Helper methods

    private void updateFollowingCountIncremental(Long userId, int increment) {
        Optional<UserDocument> docOpt = userSearchRepository.findById(userId.toString());

        if (docOpt.isPresent()) {
            UserDocument userDocument = docOpt.get();
            int currentCount = userDocument.getFollowingCount() != null ? userDocument.getFollowingCount() : 0;
            int newCount = Math.max(0, currentCount + increment);
            userDocument.setFollowingCount(newCount);
            userSearchRepository.save(userDocument);
            log.debug("Incrementally updated followingCount for user {}: {} -> {}", userId, currentCount, newCount);
        } else {
            log.warn("UserDocument not found for user ID: {} while updating followingCount, recreating document", userId);
            // Recreate the document with accurate counts from PostgreSQL
            recreateUserDocument(userId);
        }
    }

    private void updateFollowerCountIncremental(Long userId, int increment) {
        Optional<UserDocument> docOpt = userSearchRepository.findById(userId.toString());

        if (docOpt.isPresent()) {
            UserDocument userDocument = docOpt.get();
            int currentCount = userDocument.getFollowerCount() != null ? userDocument.getFollowerCount() : 0;
            int newCount = Math.max(0, currentCount + increment);
            userDocument.setFollowerCount(newCount);
            userSearchRepository.save(userDocument);
            log.debug("Incrementally updated followerCount for user {}: {} -> {}", userId, currentCount, newCount);
        } else {
            log.warn("UserDocument not found for user ID: {} while updating followerCount, recreating document", userId);
            // Recreate the document with accurate counts from PostgreSQL
            recreateUserDocument(userId);
        }
    }

    private void updateBlockedUsersList(Long userId, Long blockedUserId, boolean isBlock) {
        Optional<UserDocument> docOpt = userSearchRepository.findById(userId.toString());

        if (docOpt.isPresent()) {
            UserDocument userDocument = docOpt.get();
            List<Long> blockedUserIds = userDocument.getBlockedUserIds() != null ? userDocument.getBlockedUserIds() : new ArrayList<>();

            if (isBlock) {
                // Add to blocked users
                if (!blockedUserIds.contains(blockedUserId)) {
                    blockedUserIds.add(blockedUserId);
                    userDocument.setBlockedUserIds(blockedUserIds);
                    userSearchRepository.save(userDocument);
                    log.info("Added user ID: {} to blockedUserIds for user ID: {}", blockedUserId, userId);
                }
            } else {
                // Remove from blocked users
                if (blockedUserIds.contains(blockedUserId)) {
                    blockedUserIds.remove(blockedUserId);
                    userDocument.setBlockedUserIds(blockedUserIds);
                    userSearchRepository.save(userDocument);
                    log.info("Removed user ID: {} from blockedUserIds for user ID: {}", blockedUserId, userId);
                }
            }
        } else {
            log.warn("UserDocument not found for user ID: {} while updating blocked users, recreating document", userId);
            // Recreate the document with accurate blocked users list from PostgreSQL
            recreateUserDocument(userId);
        }
    }

    private void updateBlockedByUsersList(Long userId, Long blockerUserId, boolean isBlock) {
        Optional<UserDocument> docOpt = userSearchRepository.findById(userId.toString());

        if (docOpt.isPresent()) {
            UserDocument userDocument = docOpt.get();
            List<Long> blockedByUserIds = userDocument.getBlockedByUserIds() != null ? userDocument.getBlockedByUserIds() : new ArrayList<>();

            if (isBlock) {
                // Add to blocked by users
                if (!blockedByUserIds.contains(blockerUserId)) {
                    blockedByUserIds.add(blockerUserId);
                    userDocument.setBlockedByUserIds(blockedByUserIds);
                    userSearchRepository.save(userDocument);
                    log.info("Added user ID: {} to blockedByUserIds for user ID: {}", blockerUserId, userId);
                }
            } else {
                // Remove from blocked by users
                if (blockedByUserIds.contains(blockerUserId)) {
                    blockedByUserIds.remove(blockerUserId);
                    userDocument.setBlockedByUserIds(blockedByUserIds);
                    userSearchRepository.save(userDocument);
                    log.info("Removed user ID: {} from blockedByUserIds for user ID: {}", blockerUserId, userId);
                }
            }
        } else {
            log.warn("UserDocument not found for user ID: {} while updating blocked by users, recreating document", userId);
            // Recreate the document with accurate blocked by users list from PostgreSQL
            recreateUserDocument(userId);
        }
    }

    private void recreateUserDocument(Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
            UserDocument newDocument = buildCompleteUserDocument(user);
            userSearchRepository.save(newDocument);
            log.info("Recreated UserDocument for user ID: {}", userId);
        } catch (Exception e) {
            log.error("Failed to recreate UserDocument for user ID: {}", userId, e);
        }
    }

    private UserDocument buildCompleteUserDocument(User user) {
        // Fetch actual follower/following counts
        long followerCount = followRepository.countByFollowing_UserId(user.getUserId());
        long followingCount = followRepository.countByFollower_UserId(user.getUserId());

        // Fetch user interests
        List<UserInterest> userInterests = userInterestRepository
                .findByUser_UserId(user.getUserId(), Pageable.unpaged())
                .getContent();

        List<Long> categoryIds = userInterests.stream()
                .map(interest -> interest.getCategory().getCategoryId())
                .collect(Collectors.toList());

        // Fetch blocked users
        List<Long> blockedUserIds = userBlockRepository.findByBlocker_UserId(user.getUserId())
                .stream()
                .map(block -> block.getBlocked().getUserId())
                .collect(Collectors.toList());

        // Fetch users who blocked this user
        List<Long> blockedByUserIds = userBlockRepository.findByBlocked_UserId(user.getUserId())
                .stream()
                .map(block -> block.getBlocker().getUserId())
                .collect(Collectors.toList());

        return UserDocument.builder()
                .id(user.getUserId().toString())
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .designation(user.getDesignation())
                .summary(user.getSummary())
                .profilePictureUrl(user.getProfilePictureUrl())
                .coverPhotoUrl(user.getCoverPhotoUrl())
                .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null)
                .role(user.getRole() != null ? user.getRole().name() : null)
                .isVerified(user.getIsVerified())
                .followerCount((int) followerCount)
                .followingCount((int) followingCount)
                .interests(categoryIds)
                .faceEmbedding(null)  // Face embedding will be set separately
                .blockedUserIds(blockedUserIds)
                .blockedByUserIds(blockedByUserIds)
                .createdAt(user.getCreatedAt())
                .lastSeen(user.getLastSeen())
                .build();
    }
}
