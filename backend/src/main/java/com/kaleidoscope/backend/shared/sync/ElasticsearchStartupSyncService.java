package com.kaleidoscope.backend.shared.sync;

import com.kaleidoscope.backend.blogs.document.BlogDocument;
import com.kaleidoscope.backend.blogs.mapper.BlogMapper;
import com.kaleidoscope.backend.blogs.model.Blog;
import com.kaleidoscope.backend.blogs.repository.BlogRepository;
import com.kaleidoscope.backend.blogs.repository.search.BlogSearchRepository;
import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.model.MediaAiInsights;
import com.kaleidoscope.backend.posts.model.MediaDetectedFace;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.posts.repository.MediaAiInsightsRepository;
import com.kaleidoscope.backend.posts.repository.MediaDetectedFaceRepository;
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
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service to synchronize all data from PostgreSQL to Elasticsearch on
 * application startup
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
    private final MediaAiInsightsRepository mediaAiInsightsRepository;
    private final MediaDetectedFaceRepository mediaDetectedFaceRepository;

    // Blog components
    private final BlogRepository blogRepository;
    private final BlogSearchRepository blogSearchRepository;
    private final BlogMapper blogMapper;

    // --- IMPORT ADDED ---
    private final StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamMessageListenerContainer;

    // Optimized batch size: increased from 100 to 500 to reduce DB round-trips
    // during startup sync
    private static final int BATCH_SIZE = 500;

    @PostConstruct
    public void init() {
        log.info("✅ ElasticsearchStartupSyncService bean initialized successfully");
    }

    /**
     * Triggered automatically when the application is fully started
     * Syncs all data from PostgreSQL to Elasticsearch
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public void syncAllDataOnStartup() {
        log.info("==================== ELASTICSEARCH STARTUP SYNC STARTED ====================");
        log.info("Thread: {}", Thread.currentThread().getName());

        try {
            // Sync in order: Users first (as Posts reference Users)
            syncAllUsers();
            syncAllPosts();
            syncAllBlogs(); // NEW: sync blogs

            log.info("==================== ELASTICSEARCH STARTUP SYNC COMPLETED SUCCESSFULLY ====================");

            //
            // --- THIS IS THE KEY CHANGE ---
            //
            // Start the Redis Stream consumers ONLY AFTER all data has been synced.
            //
            log.info("Starting Redis Stream Message Listener Container...");
            streamMessageListenerContainer.start();

            // Verify the container is actually running
            if (streamMessageListenerContainer.isRunning()) {
                log.info("✅ Redis Stream consumers started successfully after data sync.");
                log.info(
                        "📡 Consumers are now actively polling for messages using offset '>' (new + pending messages)");
            } else {
                log.error("❌ Redis Stream container failed to start! Consumers will not process messages.");
            }

        } catch (Exception e) {
            log.error("==================== ELASTICSEARCH STARTUP SYNC FAILED ====================", e);
            // Don't throw - allow application to start even if ES sync fails
        }
    }

    /**
     * Sync all users from PostgreSQL to Elasticsearch
     * Uses cursor-based pagination to avoid OFFSET table scans
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

            Long lastSeenId = 0L;
            int syncedCount = 0;
            int errorCount = 0;
            int batchNumber = 0;

            while (true) {
                // Cursor-based pagination: fetch next batch where userId > lastSeenId
                Pageable pageable = PageRequest.of(0, BATCH_SIZE);
                List<User> userBatch = userRepository.findNextBatch(lastSeenId, pageable);

                if (userBatch.isEmpty()) {
                    break;
                }

                batchNumber++;
                log.info("Syncing user batch {} ({} users)", batchNumber, userBatch.size());

                for (User user : userBatch) {
                    try {
                        syncUserToElasticsearch(user);
                        syncedCount++;
                        lastSeenId = user.getUserId(); // Update cursor
                    } catch (Exception e) {
                        log.error("Failed to sync user ID: {}", user.getUserId(), e);
                        errorCount++;
                    }
                }
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
                .map(prefs -> prefs.getAllowTagging() != null ? prefs.getAllowTagging().name()
                        : Visibility.PUBLIC.name())
                .orElse(Visibility.PUBLIC.name());

        // Fetch profile visibility
        String profileVisibility = userPreferencesRepository
                .findByUser_UserId(user.getUserId())
                .map(prefs -> prefs.getProfileVisibility() != null ? prefs.getProfileVisibility().name()
                        : Visibility.PUBLIC.name())
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
     * Uses cursor-based pagination to avoid OFFSET table scans
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

            Long lastSeenId = 0L;
            int syncedCount = 0;
            int errorCount = 0;
            int batchNumber = 0;

            while (true) {
                // Cursor-based pagination: fetch next batch where postId > lastSeenId
                Pageable pageable = PageRequest.of(0, BATCH_SIZE);
                List<Post> postBatch = postRepository.findNextBatchWithRelations(lastSeenId, pageable);

                if (postBatch.isEmpty()) {
                    break;
                }

                batchNumber++;
                log.info("Syncing post batch {} ({} posts)", batchNumber, postBatch.size());

                for (Post post : postBatch) {
                    try {
                        syncPostToElasticsearch(post);
                        syncedCount++;
                        lastSeenId = post.getPostId(); // Update cursor
                    } catch (Exception e) {
                        log.error("Failed to sync post ID: {}", post.getPostId(), e);
                        errorCount++;
                    }
                }
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
                org.springframework.data.elasticsearch.core.geo.GeoPoint geoPoint = new org.springframework.data.elasticsearch.core.geo.GeoPoint(
                        location.getLatitude().doubleValue(),
                        location.getLongitude().doubleValue());
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
        List<String> hashtagNames = post.getPostHashtags().stream()
                .map(ph -> ph.getHashtag().getName())
                .collect(Collectors.toList());
        log.debug("Synced {} hashtags for post {}", hashtagNames.size(), post.getPostId());

        // --- ML INSIGHTS: Aggregate from MediaAiInsights + MediaDetectedFace ---
        List<String> aggregatedTags = new ArrayList<>();
        List<String> aggregatedCaptions = new ArrayList<>();
        List<String> aggregatedScenes = new ArrayList<>();
        int totalFaceCount = 0;

        try {
            List<MediaAiInsights> allInsights = mediaAiInsightsRepository.findByPost_PostId(post.getPostId());
            for (MediaAiInsights insight : allInsights) {
                if (insight.getTags() != null) {
                    aggregatedTags.addAll(Arrays.asList(insight.getTags()));
                }
                if (insight.getCaption() != null && !insight.getCaption().isBlank()) {
                    aggregatedCaptions.add(insight.getCaption());
                }
                if (insight.getScenes() != null) {
                    aggregatedScenes.addAll(Arrays.asList(insight.getScenes()));
                }
                // Count faces for this media
                List<MediaDetectedFace> faces = mediaDetectedFaceRepository
                        .findByMediaAiInsights_MediaId(insight.getMediaId());
                totalFaceCount += faces.size();
            }
            // Deduplicate tags and scenes
            aggregatedTags = aggregatedTags.stream().distinct().collect(Collectors.toList());
            aggregatedScenes = aggregatedScenes.stream().distinct().collect(Collectors.toList());

            if (!allInsights.isEmpty()) {
                log.debug("Populated ML insights for post {}: {} tags, {} captions, {} scenes, {} faces",
                        post.getPostId(), aggregatedTags.size(), aggregatedCaptions.size(),
                        aggregatedScenes.size(), totalFaceCount);
            }
        } catch (Exception e) {
            log.warn("Failed to load ML insights for post {}: {}. Using empty defaults.",
                    post.getPostId(), e.getMessage());
        }

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
                .mlImageTags(aggregatedTags)
                .mlCaptions(aggregatedCaptions)
                .mlScenes(aggregatedScenes)
                .peopleCount(totalFaceCount > 0 ? totalFaceCount : null)
                .hashtags(hashtagNames)
                .build();

        postSearchRepository.save(postDocument);
        log.debug("Synced post: {} (ID: {})", post.getTitle(), post.getPostId());
    }

    /**
     * Sync all blogs from PostgreSQL to Elasticsearch
     * Uses cursor-based pagination to avoid OFFSET table scans
     */
    public void syncAllBlogs() {
        log.info("Starting blog synchronization...");
        try {
            long totalBlogs = blogRepository.count();
            log.info("Found {} total blogs to sync", totalBlogs);
            if (totalBlogs == 0) {
                log.info("No blogs found. Skipping blog sync.");
                return;
            }

            Long lastSeenId = 0L;
            int syncedCount = 0;
            int errorCount = 0;
            int batchNumber = 0;

            while (true) {
                // Cursor-based pagination: fetch next batch where blogId > lastSeenId
                Pageable pageable = PageRequest.of(0, BATCH_SIZE);
                List<Blog> blogBatch = blogRepository.findNextBatchWithRelations(lastSeenId, pageable);

                if (blogBatch.isEmpty()) {
                    break;
                }

                batchNumber++;
                log.info("Syncing blog batch {} ({} blogs)", batchNumber, blogBatch.size());

                for (Blog blog : blogBatch) {
                    try {
                        syncBlogToElasticsearch(blog);
                        syncedCount++;
                        lastSeenId = blog.getBlogId(); // Update cursor
                    } catch (Exception be) {
                        log.error("Failed to sync blog ID: {}", blog.getBlogId(), be);
                        errorCount++;
                    }
                }
            }
            log.info("✅ Blog sync completed: {} synced, {} errors", syncedCount, errorCount);
        } catch (Exception e) {
            log.error("❌ Critical error during blog sync", e);
            throw e;
        }
    }

    private void syncBlogToElasticsearch(Blog blog) {
        BlogDocument document = blogMapper.toBlogDocument(blog);
        blogSearchRepository.save(document);
        log.debug("Synced blog: {} (ID: {})", blog.getTitle(), blog.getBlogId());
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
