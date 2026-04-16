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

import com.kaleidoscope.backend.posts.document.FeedItemDocument;
import com.kaleidoscope.backend.posts.document.MediaSearchDocument;
import com.kaleidoscope.backend.posts.document.RecommendationDocument;
import com.kaleidoscope.backend.posts.document.SearchAssetDocument;
import com.kaleidoscope.backend.posts.document.MediaDetectedFaceDocument;
import com.kaleidoscope.backend.posts.document.MediaAiInsightsDocument;
import com.kaleidoscope.backend.users.document.UserProfileDocument;
import com.kaleidoscope.backend.users.document.UserFaceEmbeddingDocument;
import com.kaleidoscope.backend.users.document.FaceSearchDocument;

import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHitsIterator;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.function.Function;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

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

    private final JdbcTemplate jdbcTemplate;

    // --- IMPORT ADDED ---
    private final StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamMessageListenerContainer;
    private final ElasticsearchOperations elasticsearchOperations;

    @Value("${app.elasticsearch.startup.auto-unblock-read-only:false}")
    private boolean autoUnblockReadOnlyOnStartup;

    @Value("${app.elasticsearch.startup.disable-disk-threshold:false}")
    private boolean disableDiskThresholdOnStartup;

    @Value("${spring.elasticsearch.uris:http://localhost:9200}")
    private String elasticsearchUris;

    @Value("${spring.elasticsearch.username:}")
    private String elasticsearchUsername;

    @Value("${spring.elasticsearch.password:}")
    private String elasticsearchPassword;

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
    public void syncAllDataOnStartup() {
        log.info("==================== ELASTICSEARCH STARTUP SYNC STARTED ====================");
        log.info("Thread: {}", Thread.currentThread().getName());

        try {
            // 0.0 Optional dev/testing unblock for flood-stage read-only indices
            unblockElasticsearchReadOnlyIndicesIfEnabled();

            // 0. Clean orphaned data
            cleanOrphanedData();

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

    private void unblockElasticsearchReadOnlyIndicesIfEnabled() {
        if (!autoUnblockReadOnlyOnStartup && !disableDiskThresholdOnStartup) {
            return;
        }

        String[] uriCandidates = elasticsearchUris.split(",");
        if (uriCandidates.length == 0 || uriCandidates[0].isBlank()) {
            log.warn("Skipping ES startup unblock: no spring.elasticsearch.uris configured");
            return;
        }

        String baseUri = uriCandidates[0].trim();
        if (baseUri.endsWith("/")) {
            baseUri = baseUri.substring(0, baseUri.length() - 1);
        }

        try {
            HttpClient client = HttpClient.newHttpClient();

            if (disableDiskThresholdOnStartup) {
                String disableThresholdBody = "{\"transient\":{\"cluster.routing.allocation.disk.threshold_enabled\":false}}";
                sendEsPut(client, baseUri + "/_cluster/settings", disableThresholdBody);
                log.warn("⚠️ Disabled Elasticsearch disk threshold checks for startup (testing mode)");
            }

            if (autoUnblockReadOnlyOnStartup) {
                String clearReadOnlyBody = "{\"index.blocks.read_only_allow_delete\":null}";
                sendEsPut(client, baseUri + "/_all/_settings", clearReadOnlyBody);
                log.info("✅ Cleared Elasticsearch read_only_allow_delete blocks before startup sync");
            }
        } catch (Exception e) {
            log.warn("Could not auto-unblock Elasticsearch read-only indices before startup sync", e);
        }
    }

    private void sendEsPut(HttpClient client, String url, String jsonBody) throws Exception {
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(jsonBody));

        if (elasticsearchUsername != null && !elasticsearchUsername.isBlank()) {
            String credentials = elasticsearchUsername + ":" + (elasticsearchPassword == null ? "" : elasticsearchPassword);
            String basicAuth = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
            requestBuilder.header("Authorization", "Basic " + basicAuth);
        }

        HttpResponse<String> response = client.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();
        if (status < 200 || status >= 300) {
            throw new IllegalStateException("Elasticsearch request failed with status " + status + ": " + response.body());
        }
    }

    /**
     * Cleans up orphaned data in Elasticsearch and PostgreSQL Read Models.
     * Removes ES documents that have been hard/soft deleted from PostgreSQL.
     * Clears PostgreSQL read models for deleted content.
     */
    private void cleanOrphanedData() {
        log.info("Starting robust orphaned data cleanup...");
        try {
            // 1. PostgreSQL Read Model Cleanup
            log.info("Cleaning orphaned PostgreSQL Read Models...");
            int rmPosts = jdbcTemplate.update(
                    "DELETE FROM read_model_post_search WHERE post_id NOT IN (SELECT post_id FROM posts WHERE deleted_at IS NULL)");
            int rmMedia = jdbcTemplate.update(
                    "DELETE FROM read_model_media_search WHERE post_id NOT IN (SELECT post_id FROM posts WHERE deleted_at IS NULL)");
            int rmFaces = jdbcTemplate.update(
                    "DELETE FROM read_model_face_search WHERE post_id NOT IN (SELECT post_id FROM posts WHERE deleted_at IS NULL)");
            int rmKnn = jdbcTemplate.update(
                    "DELETE FROM read_model_recommendations_knn WHERE media_id NOT IN (SELECT media_id FROM media_ai_insights)");
            log.info("Cleaned orphaned PG Read Models: {} PostSearch, {} MediaSearch, {} FaceSearch, {} Knn", rmPosts,
                    rmMedia, rmFaces, rmKnn);

            // 2. Load Valid IDs from PostgreSQL into memory sets (extremely fast)
            log.info("Loading valid IDs from PostgreSQL into memory...");
            Set<Long> validUserIds = new HashSet<>(jdbcTemplate.queryForList("SELECT user_id FROM users", Long.class));
            Set<Long> validPostIds = new HashSet<>(
                    jdbcTemplate.queryForList("SELECT post_id FROM posts WHERE deleted_at IS NULL", Long.class));
            Set<Long> validBlogIds = new HashSet<>(jdbcTemplate.queryForList("SELECT blog_id FROM blogs", Long.class));
            Set<Long> validMediaIds = new HashSet<>(
                    jdbcTemplate.queryForList("SELECT media_id FROM media_ai_insights", Long.class));
            log.info("Loaded {} user IDs, {} post IDs, {} blog IDs, {} media IDs.", validUserIds.size(),
                    validPostIds.size(), validBlogIds.size(), validMediaIds.size());

            // 3. Clear out User-dependent Elasticsearch indices
            log.info("Cleaning User-dependent Elasticsearch indices...");
            cleanIndex(UserDocument.class, UserDocument::getUserId, validUserIds);
            cleanIndex(UserProfileDocument.class, UserProfileDocument::getUserId, validUserIds);
            cleanIndex(UserFaceEmbeddingDocument.class, UserFaceEmbeddingDocument::getUserId, validUserIds);

            // 4. Clear out Post-dependent Elasticsearch indices
            log.info("Cleaning Post-dependent Elasticsearch indices...");
            cleanIndex(PostDocument.class, PostDocument::getPostId, validPostIds);
            cleanIndex(FeedItemDocument.class, FeedItemDocument::getPostId, validPostIds);
            cleanIndex(MediaSearchDocument.class, MediaSearchDocument::getPostId, validPostIds);
            cleanIndex(FaceSearchDocument.class, FaceSearchDocument::getPostId, validPostIds);
            cleanIndex(MediaAiInsightsDocument.class, MediaAiInsightsDocument::getPostId, validPostIds);
            cleanIndex(MediaDetectedFaceDocument.class, MediaDetectedFaceDocument::getMediaId, validMediaIds);
            cleanIndex(SearchAssetDocument.class, SearchAssetDocument::getPostId, validPostIds);

            // 5. Clear out Blog-dependent Elasticsearch indices
            log.info("Cleaning Blog-dependent Elasticsearch indices...");
            cleanIndex(BlogDocument.class, BlogDocument::getBlogId, validBlogIds);

            // 6. Clear out Media-dependent Elasticsearch indices (Recommendations)
            log.info("Cleaning Media-dependent Elasticsearch indices...");
            cleanIndex(RecommendationDocument.class, RecommendationDocument::getMediaId, validMediaIds);

            log.info("Successfully finished Elasticsearch streaming cleanup.");
        } catch (Exception e) {
            log.error("Failed to clean orphaned data", e);
        }
    }

    /**
     * Streams through an entire Elasticsearch index, deleting any document whose
     * primary associated ID
     * (e.g. userId, postId) is NOT found in the set of valid IDs from PostgreSQL.
     */
    private <T> void cleanIndex(Class<T> docClass, Function<T, Long> idExtractor, Set<Long> validIds) {
        int deletedCount = 0;
        try (SearchHitsIterator<T> stream = elasticsearchOperations.searchForStream(
                NativeQuery.builder().withQuery(q -> q.matchAll(m -> m)).build(), docClass)) {
            while (stream.hasNext()) {
                T doc = stream.next().getContent();
                Long docId = idExtractor.apply(doc);
                if (docId != null && !validIds.contains(docId)) {
                    elasticsearchOperations.delete(doc);
                    deletedCount++;
                }
            }
            log.debug("Cleaned index for {}: Deleted {} orphaned documents.", docClass.getSimpleName(), deletedCount);
        } catch (Exception e) {
            log.error("Error while cleaning index for " + docClass.getSimpleName(), e);
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

        // Fetch user preferences in a single call
        var prefs = userPreferencesRepository.findByUser_UserId(user.getUserId()).orElse(null);

        String allowTagging = (prefs != null && prefs.getAllowTagging() != null)
                ? prefs.getAllowTagging().name()
                : Visibility.PUBLIC.name();

        String profileVisibility = (prefs != null && prefs.getProfileVisibility() != null)
                ? prefs.getProfileVisibility().name()
                : Visibility.PUBLIC.name();

        boolean showEmail = prefs != null && Boolean.TRUE.equals(prefs.getShowEmail());
        boolean searchDiscoverable = prefs == null || !Boolean.FALSE.equals(prefs.getSearchDiscoverable());

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
                .showEmail(showEmail)
                .searchDiscoverable(searchDiscoverable)
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
                List<Long> postIds = postRepository.findNextBatchIds(lastSeenId, pageable);

                if (postIds.isEmpty()) {
                    break;
                }

                List<Post> postBatch = postRepository.findByPostIdInWithRelations(postIds);

                if (postBatch.isEmpty()) {
                    break;
                }

                batchNumber++;
                log.info("Syncing post batch {} ({} posts)", batchNumber, postBatch.size());

                for (Post post : postBatch) {
                    try {
                        syncPostToElasticsearch(post);
                        syncedCount++;
                    } catch (Exception e) {
                        log.error("Failed to sync post ID: {}", post.getPostId(), e);
                        errorCount++;
                    }
                }

                // Always advance the cursor to avoid reprocessing the same batch forever.
                lastSeenId = postIds.get(postIds.size() - 1);
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
                    Arrays.stream(insight.getTags())
                            .filter(tag -> tag != null && !tag.isBlank())
                            .map(tag -> tag.trim().toLowerCase(Locale.ROOT))
                            .forEach(aggregatedTags::add);
                }
                if (insight.getCaption() != null && !insight.getCaption().isBlank()) {
                    aggregatedCaptions.add(insight.getCaption());
                }
                if (insight.getScenes() != null) {
                    Arrays.stream(insight.getScenes())
                            .filter(scene -> scene != null && !scene.isBlank())
                            .map(scene -> scene.trim().toLowerCase(Locale.ROOT))
                            .forEach(aggregatedScenes::add);
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
                List<Long> blogIds = blogRepository.findNextBatchIds(lastSeenId, pageable);

                if (blogIds.isEmpty()) {
                    break;
                }

                List<Blog> blogBatch = blogRepository.findByBlogIdInWithRelations(blogIds);

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
