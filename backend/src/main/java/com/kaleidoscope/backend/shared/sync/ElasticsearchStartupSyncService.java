package com.kaleidoscope.backend.shared.sync;

import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.repository.search.PostSearchRepository;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.users.document.UserDocument;
import com.kaleidoscope.backend.users.enums.Visibility;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserInterest;
import com.kaleidoscope.backend.users.repository.*;
import com.kaleidoscope.backend.users.repository.search.UserSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // <-- IMPORT ADDED

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service to synchronize all data from PostgreSQL to Elasticsearch on application startup
 * This ensures Elasticsearch indices are always in sync with the database
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ElasticsearchStartupSyncService {

    private final UserRepository userRepository;
    private final UserSearchRepository userSearchRepository;
    private final UserInterestRepository userInterestRepository;
    private final FollowRepository followRepository;
    private final UserBlockRepository userBlockRepository;
    private final UserPreferencesRepository userPreferencesRepository;

    private final PostRepository postRepository;
    private final PostSearchRepository postSearchRepository;

    private static final int BATCH_SIZE = 100;

    /**
     * Triggered automatically when the application is fully started
     * Syncs all data from PostgreSQL to Elasticsearch
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async("taskExecutor")
    @Transactional(readOnly = true) // <-- FIX: ANNOTATION MOVED HERE
    public void syncAllDataOnStartup() {
        log.info("==================== ELASTICSEARCH STARTUP SYNC STARTED ====================");

        try {
            // Sync in order: Users first (as Posts reference Users)
            syncAllUsers();
            syncAllPosts();

            log.info("==================== ELASTICSEARCH STARTUP SYNC COMPLETED SUCCESSFULLY ====================");
        } catch (Exception e) {
            log.error("==================== ELASTICSEARCH STARTUP SYNC FAILED ====================", e);
            // Don't throw - allow application to start even if ES sync fails
        }
    }

    /**
     * Sync all users from PostgreSQL to Elasticsearch
     */
    // @Transactional(readOnly = true) // <-- Removed from here
    public void syncAllUsers() {
        log.info("Starting user synchronization to Elasticsearch...");

        try {
            long totalUsers = userRepository.count();
            log.info("Found {} total users to sync", totalUsers);

            if (totalUsers == 0) {
                log.info("No users found in database. Skipping user sync.");
                return;
            }

            int pageNumber = 0;
            int syncedCount = 0;
            int errorCount = 0;

            while (true) {
                Pageable pageable = PageRequest.of(pageNumber, BATCH_SIZE);
                Page<User> userPage = userRepository.findAll(pageable);

                if (userPage.isEmpty()) {
                    break;
                }

                log.info("Syncing user batch {}/{} ({} users)",
                        pageNumber + 1, userPage.getTotalPages(), userPage.getNumberOfElements());

                for (User user : userPage.getContent()) {
                    try {
                        syncUserToElasticsearch(user);
                        syncedCount++;
                    } catch (Exception e) {
                        log.error("Failed to sync user ID: {}", user.getUserId(), e);
                        errorCount++;
                    }
                }

                if (!userPage.hasNext()) {
                    break;
                }
                pageNumber++;
            }

            log.info("✅ User sync completed: {} synced, {} errors", syncedCount, errorCount);
        } catch (Exception e) {
            log.error("❌ Critical error during user sync", e);
            throw e;
        }
    }

    /**
     * Sync a single user to Elasticsearch with all related data
     */
    private void syncUserToElasticsearch(User user) {
        // Fetch user interests
        List<Long> interestIds = userInterestRepository
                .findByUser_UserId(user.getUserId(), Pageable.unpaged())
                .stream()
                .map(UserInterest::getCategory)
                .map(Category::getCategoryId)
                .collect(Collectors.toList());

        // Fetch follower and following counts
        long followerCount = followRepository.countByFollowing_UserId(user.getUserId());
        long followingCount = followRepository.countByFollower_UserId(user.getUserId());

        // Fetch blocked users (users this user has blocked)
        List<Long> blockedUserIds = userBlockRepository
                .findByBlocker_UserId(user.getUserId())
                .stream()
                .map(block -> block.getBlocked().getUserId())
                .collect(Collectors.toList());

        // Fetch users who blocked this user
        List<Long> blockedByUserIds = userBlockRepository
                .findByBlocked_UserId(user.getUserId())
                .stream()
                .map(block -> block.getBlocker().getUserId())
                .collect(Collectors.toList());

        // Fetch tagging preference
        String allowTagging = userPreferencesRepository
                .findByUser_UserId(user.getUserId())
                .map(prefs -> prefs.getAllowTagging() != null ? prefs.getAllowTagging().name() : Visibility.PUBLIC.name())
                .orElse(Visibility.PUBLIC.name());

        // Fetch profile visibility
        String profileVisibility = userPreferencesRepository
                .findByUser_UserId(user.getUserId())
                .map(prefs -> prefs.getProfileVisibility() != null ? prefs.getProfileVisibility().name() : Visibility.PUBLIC.name())
                .orElse(Visibility.PUBLIC.name());


        // Build UserDocument
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
                .followerCount((int) followerCount)
                .followingCount((int) followingCount)
                .interests(interestIds)
                .blockedUserIds(blockedUserIds)
                .blockedByUserIds(blockedByUserIds)
                .allowTagging(allowTagging)
                .profileVisibility(profileVisibility) // <-- FIELD ADDED
                .faceEmbedding(null) // Will be updated by ML service
                .createdAt(user.getCreatedAt())
                .lastSeen(user.getLastSeen())
                .build();

        userSearchRepository.save(userDocument);
        log.debug("Synced user: {} (ID: {})", user.getUsername(), user.getUserId());
    }

    /**
     * Sync all posts from PostgreSQL to Elasticsearch
     */
    // @Transactional(readOnly = true) // <-- Removed from here
    public void syncAllPosts() {
        log.info("Starting post synchronization to Elasticsearch...");

        try {
            long totalPosts = postRepository.count();
            log.info("Found {} total posts to sync", totalPosts);

            if (totalPosts == 0) {
                log.info("No posts found in database. Skipping post sync.");
                return;
            }

            int pageNumber = 0;
            int syncedCount = 0;
            int errorCount = 0;

            while (true) {
                Pageable pageable = PageRequest.of(pageNumber, BATCH_SIZE);
                // Use findAllWithRelations to eagerly fetch user and other associations
                Page<Post> postPage = postRepository.findAllWithRelations(pageable);

                if (postPage.isEmpty()) {
                    break;
                }

                log.info("Syncing post batch {}/{} ({} posts)",
                        pageNumber + 1, postPage.getTotalPages(), postPage.getNumberOfElements());

                for (Post post : postPage.getContent()) {
                    try {
                        syncPostToElasticsearch(post);
                        syncedCount++;
                    } catch (Exception e) {
                        log.error("Failed to sync post ID: {}", post.getPostId(), e);
                        errorCount++;
                    }
                }

                if (!postPage.hasNext()) {
                    break;
                }
                pageNumber++;
            }

            log.info("✅ Post sync completed: {} synced, {} errors", syncedCount, errorCount);
        } catch (Exception e) {
            log.error("❌ Critical error during post sync", e);
            throw e;
        }
    }

    /**
     * Sync a single post to Elasticsearch with all related data
     */
    private void syncPostToElasticsearch(Post post) {
        User author = post.getUser();

        // Build author object
        PostDocument.Author authorDoc = PostDocument.Author.builder()
                .userId(author.getUserId())
                .username(author.getUsername())
                .profilePictureUrl(author.getProfilePictureUrl())
                .email(author.getEmail())
                .accountStatus(author.getAccountStatus() != null ? author.getAccountStatus().name() : null)
                .build();

        // Build categories list
        List<PostDocument.Category> categories = post.getCategories().stream()
                .map(pc -> PostDocument.Category.builder()
                        .categoryId(pc.getCategory().getCategoryId())
                        .name(pc.getCategory().getName())
                        .build())
                .collect(Collectors.toList());

        // Build location object with GeoPoint
        PostDocument.LocationInfo locationInfo = null;
        Location location = post.getLocation();
        if (location != null) {
            Long locationId = location.getLocationId();
            String locationName = location.getName();
            if (location.getLatitude() != null && location.getLongitude() != null) {
                org.springframework.data.elasticsearch.core.geo.GeoPoint geoPoint =
                        new org.springframework.data.elasticsearch.core.geo.GeoPoint(
                                location.getLatitude().doubleValue(),
                                location.getLongitude().doubleValue()
                        );
                locationInfo = PostDocument.LocationInfo.builder()
                        .id(locationId)
                        .name(locationName)
                        .point(geoPoint)
                        .build();
            } else {
                // Location exists but has no coordinates
                locationInfo = PostDocument.LocationInfo.builder()
                        .id(locationId)
                        .name(locationName)
                        .point(null)
                        .build();
            }
            log.debug("Synced location for post {}: locationId={}, name={}, hasCoordinates={}",
                    post.getPostId(), locationId, locationName, locationInfo.getPoint() != null);
        }

        // Find thumbnail URL (first media item)
        String thumbnailUrl = post.getMedia().stream()
                .min(Comparator.comparing(PostMedia::getPosition))
                .map(PostMedia::getMediaUrl)
                .orElse(null);

        // Extract hashtag names from post
        List<String> hashtagNames = post.getPostHashtags().stream() // <-- This is where the fix takes effect
                .map(ph -> ph.getHashtag().getName())
                .collect(Collectors.toList());
        log.debug("Synced {} hashtags for post {}", hashtagNames.size(), post.getPostId());

        // Build PostDocument
        PostDocument postDocument = PostDocument.builder()
                .id(post.getPostId().toString())
                .postId(post.getPostId())
                .title(post.getTitle())
                .body(post.getBody())
                .summary(post.getSummary())
                .thumbnailUrl(thumbnailUrl)
                .visibility(post.getVisibility())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .author(authorDoc)
                .categories(categories)
                .location(locationInfo)
                .reactionCount(0L) // Initial value, will be updated by interaction events
                .commentCount(0L) // Initial value, will be updated by interaction events
                .viewCount(0L) // Initial value, will be updated by view tracking
                .mlImageTags(new ArrayList<>()) // Will be updated by ML service
                .peopleCount(null) // Will be updated by ML service
                .hashtags(hashtagNames) // Add hashtags to document
                .build();

        postSearchRepository.save(postDocument);
        log.debug("Synced post: {} (ID: {})", post.getTitle(), post.getPostId());
    }

    /**
     * Manual trigger to re-sync all data (can be called via admin endpoint)
     */
    public void manualSyncAll() {
        log.info("Manual sync triggered by admin");
        syncAllDataOnStartup();
    }

    /**
     * Get sync statistics
     */
    public SyncStatistics getSyncStatistics() {
        long dbUserCount = userRepository.count();
        long esUserCount = userSearchRepository.count();
        long dbPostCount = postRepository.count();
        long esPostCount = postSearchRepository.count();

        return SyncStatistics.builder()
                .dbUserCount(dbUserCount)
                .esUserCount(esUserCount)
                .dbPostCount(dbPostCount)
                .esPostCount(esPostCount)
                .usersSynced(dbUserCount == esUserCount)
                .postsSynced(dbPostCount == esPostCount)
                .build();
    }

    /**
     * Statistics DTO
     */
    @lombok.Data
    @lombok.Builder
    public static class SyncStatistics {
        private long dbUserCount;
        private long esUserCount;
        private long dbPostCount;
        private long esPostCount;
        private boolean usersSynced;
        private boolean postsSynced;
    }
}