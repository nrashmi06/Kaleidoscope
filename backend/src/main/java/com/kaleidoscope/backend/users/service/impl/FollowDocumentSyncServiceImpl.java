package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.users.document.FollowDocument;
import com.kaleidoscope.backend.users.model.Follow;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.search.FollowSearchRepository;
import com.kaleidoscope.backend.users.service.FollowDocumentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowDocumentSyncServiceImpl implements FollowDocumentSyncService {

    private final FollowSearchRepository followSearchRepository;

    @Override
    @Transactional
    public void syncOnFollow(Follow follow) {
        try {
            log.info("Syncing FollowDocument on follow: follower={}, following={}",
                    follow.getFollower().getUserId(), follow.getFollowing().getUserId());

            // Create composite ID: followerId_followingId
            String compositeId = buildCompositeId(follow.getFollower().getUserId(), follow.getFollowing().getUserId());

            User follower = follow.getFollower();
            User following = follow.getFollowing();

            // Build FollowDocument
            FollowDocument followDocument = FollowDocument.builder()
                    .id(compositeId)
                    .follower(FollowDocument.UserSummary.builder()
                            .userId(follower.getUserId())
                            .username(follower.getUsername())
                            .profilePictureUrl(follower.getProfilePictureUrl())
                            .build())
                    .following(FollowDocument.UserSummary.builder()
                            .userId(following.getUserId())
                            .username(following.getUsername())
                            .profilePictureUrl(following.getProfilePictureUrl())
                            .build())
                    .createdAt(follow.getCreatedAt())
                    .build();

            followSearchRepository.save(followDocument);
            log.info("Successfully synced FollowDocument with ID: {}", compositeId);
        } catch (Exception e) {
            log.error("Failed to sync FollowDocument on follow for follower {} and following {}",
                    follow.getFollower().getUserId(), follow.getFollowing().getUserId(), e);
            // Don't throw exception - we don't want to break follow action if ES fails
        }
    }

    @Override
    @Transactional
    public void syncOnUnfollow(Long followerId, Long followingId) {
        try {
            log.info("Syncing FollowDocument on unfollow: follower={}, following={}", followerId, followingId);

            // Create composite ID: followerId_followingId
            String compositeId = buildCompositeId(followerId, followingId);

            // Delete the document
            followSearchRepository.deleteById(compositeId);
            log.info("Successfully deleted FollowDocument with ID: {}", compositeId);
        } catch (Exception e) {
            log.error("Failed to sync FollowDocument on unfollow for follower {} and following {}",
                    followerId, followingId, e);
            // Don't throw exception - we don't want to break unfollow action if ES fails
        }
    }

    /**
     * Build composite ID for FollowDocument
     * Format: followerId_followingId
     */
    private String buildCompositeId(Long followerId, Long followingId) {
        return followerId + "_" + followingId;
    }
}
