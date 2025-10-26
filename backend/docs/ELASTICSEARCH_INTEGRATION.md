# Kaleidoscope Elasticsearch Integration Documentation

## Overview

Elasticsearch is integrated into the Kaleidoscope application to provide high-performance, full-text search capabilities and advanced filtering for users, posts, and other content. This document provides a comprehensive guide on how Elasticsearch is configured, indexed, queried, and synchronized with the PostgreSQL database.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Configuration](#configuration)
3. [Document Models](#document-models)
4. [Repositories](#repositories)
5. [Data Synchronization](#data-synchronization)
6. [Search Operations](#search-operations)
7. [Advanced Queries](#advanced-queries)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ELASTICSEARCH INTEGRATION                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL Database                        │   │
│  │                  (Source of Truth)                            │   │
│  │  - Users, Posts, Comments, Media, Categories, etc.           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              │ Sync on Startup                        │
│                              │ & Real-time Updates                    │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │            ElasticsearchStartupSyncService                    │   │
│  │  - Batch synchronization (100 items per batch)               │   │
│  │  - Triggered on ApplicationReadyEvent                         │   │
│  │  - Syncs Users → Posts → Other Documents                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  Elasticsearch Cluster                        │   │
│  │                    (Search Engine)                            │   │
│  │                                                               │   │
│  │  Indices:                                                     │   │
│  │  - users                    - media_search                   │   │
│  │  - posts                    - media_ai_insights              │   │
│  │  - feed_items               - media_detected_faces           │   │
│  │  - recommendations          - search_assets                  │   │
│  │  - follows                  - face_search                    │   │
│  │  - user_profiles            - user_face_embeddings           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Custom Search Repositories                       │   │
│  │  - UserSearchRepositoryImpl                                   │   │
│  │  - PostSearchRepositoryImpl                                   │   │
│  │  - Complex queries with filtering & scoring                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    REST Controllers                           │   │
│  │  - User search, Post search, Follow suggestions, etc.        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

- **PostgreSQL**: Primary data store (source of truth)
- **Elasticsearch**: Search and analytics engine (indexed data)
- **ElasticsearchTemplate**: Spring Data interface for Elasticsearch operations
- **Custom Repositories**: Complex query implementations
- **Document Models**: Java classes representing Elasticsearch documents
- **Sync Service**: Automatic data synchronization on startup

## Configuration

### Docker Compose Setup

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
  container_name: kaleidoscope-elasticsearch
  environment:
    - "discovery.type=single-node"
    - "xpack.security.enabled=false"
    - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
  ports:
    - "9200:9200"
  networks:
    - app-network
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 30
    start_period: 60s
  restart: always
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 2G
```

### Spring Boot Configuration

**application.yml**:
```yaml
spring:
  elasticsearch:
    uris: ${SPRING_ELASTICSEARCH_URIS:http://localhost:9200}
```

**Environment Variables**:
- `SPRING_ELASTICSEARCH_URIS`: Elasticsearch connection URL(s)
- Default: `http://localhost:9200`
- Production: `http://elasticsearch:9200` (Docker network)

### Maven Dependencies

**pom.xml**:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
</dependency>
```

This includes:
- Elasticsearch Java Client (8.x)
- Spring Data Elasticsearch
- Jackson for JSON serialization

## Document Models

### Overview

Document models are Java classes annotated with `@Document` that represent Elasticsearch indices. They mirror database entities but are optimized for search operations.

### User Document

**Index**: `users`

**Purpose**: Fast user search, filtering, and follow suggestions

```java
@Document(indexName = "users")
public class UserDocument {
    @Id
    private String id;                      // Elasticsearch document ID
    
    @Field(type = FieldType.Long)
    private Long userId;                    // PostgreSQL user ID
    
    @Field(type = FieldType.Keyword)
    private String username;                // Exact match
    
    @Field(type = FieldType.Keyword)
    private String email;                   // Exact match
    
    @Field(type = FieldType.Text)
    private String designation;             // Full-text search
    
    @Field(type = FieldType.Text)
    private String summary;                 // Full-text search
    
    @Field(type = FieldType.Keyword)
    private String profilePictureUrl;
    
    @Field(type = FieldType.Keyword)
    private String accountStatus;           // ACTIVE, SUSPENDED, etc.
    
    @Field(type = FieldType.Keyword)
    private String role;                    // USER, ADMIN
    
    @Field(type = FieldType.Boolean)
    private Boolean isVerified;
    
    @Field(type = FieldType.Integer)
    private Integer followerCount;          // Social graph metrics
    
    @Field(type = FieldType.Integer)
    private Integer followingCount;
    
    @Field(type = FieldType.Long)
    private List<Long> interests;           // Category IDs
    
    @Field(type = FieldType.Long)
    private List<Long> blockedUserIds;      // Blocked users
    
    @Field(type = FieldType.Long)
    private List<Long> blockedByUserIds;    // Users who blocked this user
    
    @Field(type = FieldType.Keyword)
    private String allowTagging;            // PUBLIC, FRIENDS_ONLY, NO_ONE
    
    @Field(type = FieldType.Keyword)
    private String profileVisibility;       // Visibility setting
    
    @Field(type = FieldType.Dense_Vector, dims = 1024)
    private float[] faceEmbedding;          // ML face embedding for similarity
    
    @Field(type = FieldType.Date)
    private LocalDateTime createdAt;
    
    @Field(type = FieldType.Date)
    private LocalDateTime lastSeen;
}
```

**Key Features**:
- **Keyword Fields**: Exact matching (username, email, status)
- **Text Fields**: Full-text search (designation, summary)
- **Dense Vector**: ML-powered face similarity search (1024 dimensions)
- **Social Graph**: Embedded follower/following counts and interest lists
- **Privacy**: Blocked user IDs for filtering results

### Post Document

**Index**: `posts`

**Purpose**: Fast post search, filtering, and recommendations

```java
@Document(indexName = "posts")
public class PostDocument {
    @Id
    private String id;
    
    @Field(type = FieldType.Long)
    private Long postId;
    
    @Field(type = FieldType.Text, fielddata = true)
    private String title;
    
    @Field(type = FieldType.Text)
    private String body;
    
    @Field(type = FieldType.Text)
    private String summary;
    
    @Field(type = FieldType.Keyword)
    private String thumbnailUrl;
    
    @Field(type = FieldType.Keyword)
    private PostVisibility visibility;      // PUBLIC, FRIENDS_ONLY, PRIVATE
    
    @Field(type = FieldType.Keyword)
    private PostStatus status;              // PUBLISHED, DRAFT, ARCHIVED
    
    @Field(type = FieldType.Date)
    private LocalDateTime createdAt;
    
    @Field(type = FieldType.Object)
    private Author author;                  // Nested author details
    
    @Field(type = FieldType.Nested)
    private List<Category> categories;      // Nested category objects
    
    @Field(type = FieldType.Long)
    private long reactionCount;
    
    @Field(type = FieldType.Long)
    private long commentCount;
    
    @Field(type = FieldType.Long)
    private Long viewCount;
    
    @Field(type = FieldType.Keyword)
    private List<String> mlImageTags;       // AI-generated tags
    
    @Field(type = FieldType.Integer)
    private Integer peopleCount;            // Number of people in images
    
    // Nested Classes
    public static class Author {
        @Field(type = FieldType.Long)
        private Long userId;
        
        @Field(type = FieldType.Keyword)
        private String username;
        
        @Field(type = FieldType.Keyword)
        private String profilePictureUrl;
    }
    
    public static class Category {
        @Field(type = FieldType.Long)
        private Long categoryId;
        
        @Field(type = FieldType.Keyword)
        private String name;
    }
}
```

**Key Features**:
- **Nested Objects**: Author and categories embedded for fast access
- **ML Tags**: AI-generated image tags for content-based filtering
- **Engagement Metrics**: Reaction, comment, and view counts for ranking
- **Visibility Control**: Filters based on post visibility and status

### Other Document Models

**Additional Indices**:
- `feed_items`: Personalized feed generation
- `recommendations`: Recommendation engine data
- `media_search`: Media-specific search
- `media_ai_insights`: AI analysis results
- `media_detected_faces`: Face detection data
- `face_search`: Face recognition search
- `search_assets`: General search assets
- `follows`: Follow relationships
- `user_profiles`: Extended user profile data
- `user_face_embeddings`: User face embeddings

## Repositories

### Standard Elasticsearch Repositories

Spring Data Elasticsearch provides basic CRUD operations:

```java
@Repository
public interface UserSearchRepository 
    extends ElasticsearchRepository<UserDocument, String>, 
            UserSearchRepositoryCustom {
    // Auto-generated methods:
    // - save(UserDocument)
    // - findById(String)
    // - findAll()
    // - delete(UserDocument)
    // - count()
}

@Repository
public interface PostSearchRepository 
    extends ElasticsearchRepository<PostDocument, String>,
            PostSearchRepositoryCustom {
    // Auto-generated methods available
}
```

### Custom Repository Interfaces

For complex queries, define custom interfaces:

```java
public interface UserSearchRepositoryCustom {
    Page<UserDocument> findFilteredUsers(
        String status, 
        String searchTerm, 
        Pageable pageable
    );
    
    Page<UserDocument> findTaggableUsers(
        Long currentUserId,
        List<Long> blockedUserIds,
        List<Long> blockedByUserIds,
        String query,
        Pageable pageable
    );
    
    Page<UserDocument> findFollowSuggestions(
        Long targetUserId,
        Set<Long> exclusions,
        List<Long> blockedUserIds,
        List<Long> blockedByUserIds,
        Set<Long> friendsOfFriendsIds,
        List<Long> targetUserInterests,
        String targetUserDesignation,
        Pageable pageable
    );
}
```

### Custom Repository Implementations

**UserSearchRepositoryImpl** uses `ElasticsearchTemplate` for complex queries:

```java
@Repository
@RequiredArgsConstructor
public class UserSearchRepositoryImpl implements UserSearchRepositoryCustom {
    
    private final ElasticsearchTemplate elasticsearchTemplate;
    
    @Override
    public Page<UserDocument> findFilteredUsers(
            String status, String searchTerm, Pageable pageable) {
        
        // Build bool query
        BoolQuery.Builder boolQueryBuilder = new BoolQuery.Builder();
        
        // Must match: role = USER
        boolQueryBuilder.must(Query.of(q -> q.term(t -> t
                .field("role")
                .value(Role.USER.name())
        )));
        
        // Filter by status if provided
        if (status != null && !status.trim().isEmpty()) {
            boolQueryBuilder.must(Query.of(q -> q.term(t -> t
                    .field("accountStatus")
                    .value(status.toUpperCase())
            )));
        }
        
        // Filter by search term if provided
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            BoolQuery.Builder searchQueryBuilder = new BoolQuery.Builder();
            searchQueryBuilder.minimumShouldMatch("1");
            
            // Search in username
            searchQueryBuilder.should(Query.of(q -> q.wildcard(w -> w
                    .field("username")
                    .value("*" + searchTerm.toLowerCase() + "*")
                    .caseInsensitive(true)
            )));
            
            // Search in email
            searchQueryBuilder.should(Query.of(q -> q.wildcard(w -> w
                    .field("email")
                    .value("*" + searchTerm.toLowerCase() + "*")
                    .caseInsensitive(true)
            )));
            
            boolQueryBuilder.must(Query.of(q -> q.bool(searchQueryBuilder.build())));
        }
        
        // Build native query with pagination
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(Query.of(q -> q.bool(boolQueryBuilder.build())))
                .withPageable(pageable)
                .build();
        
        // Execute search
        SearchHits<UserDocument> searchHits = 
            elasticsearchTemplate.search(nativeQuery, UserDocument.class);
        
        // Convert to Page
        List<UserDocument> documents = searchHits.getSearchHits()
                .stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());
        
        return new PageImpl<>(documents, pageable, searchHits.getTotalHits());
    }
}
```

## Data Synchronization

### Startup Synchronization

**ElasticsearchStartupSyncService** automatically synchronizes all data from PostgreSQL to Elasticsearch when the application starts.

**Trigger**: `ApplicationReadyEvent`

**Execution**: Asynchronous (`@Async`)

**Process**:
```
1. Application starts
2. ApplicationReadyEvent fires
3. syncAllDataOnStartup() executes asynchronously
4. Sync users (in batches of 100)
5. Sync posts (in batches of 100)
6. Sync other documents...
7. Log completion status
```

### User Synchronization

```java
@Transactional(readOnly = true)
public void syncAllUsers() {
    long totalUsers = userRepository.count();
    int pageNumber = 0;
    int syncedCount = 0;
    
    while (true) {
        Pageable pageable = PageRequest.of(pageNumber, BATCH_SIZE);
        Page<User> userPage = userRepository.findAll(pageable);
        
        if (userPage.isEmpty()) break;
        
        for (User user : userPage.getContent()) {
            syncUserToElasticsearch(user);
            syncedCount++;
        }
        
        if (!userPage.hasNext()) break;
        pageNumber++;
    }
    
    log.info("User sync completed: {} synced", syncedCount);
}

private void syncUserToElasticsearch(User user) {
    // Fetch related data
    List<Long> interestIds = fetchUserInterests(user.getUserId());
    long followerCount = followRepository.countByFollowing(user);
    long followingCount = followRepository.countByFollower(user);
    List<Long> blockedUserIds = fetchBlockedUsers(user.getUserId());
    List<Long> blockedByUserIds = fetchBlockedByUsers(user.getUserId());
    
    // Fetch preferences
    UserPreferences prefs = fetchUserPreferences(user.getUserId());
    
    // Fetch face embedding
    float[] faceEmbedding = fetchFaceEmbedding(user.getUserId());
    
    // Build UserDocument
    UserDocument userDoc = UserDocument.builder()
            .id(user.getUserId().toString())
            .userId(user.getUserId())
            .username(user.getUsername())
            .email(user.getEmail())
            .designation(user.getDesignation())
            .profilePictureUrl(user.getProfilePictureUrl())
            .accountStatus(user.getAccountStatus().name())
            .role(user.getRole().name())
            .isVerified(user.getIsVerified())
            .followerCount((int) followerCount)
            .followingCount((int) followingCount)
            .interests(interestIds)
            .blockedUserIds(blockedUserIds)
            .blockedByUserIds(blockedByUserIds)
            .allowTagging(prefs.getAllowTagging().name())
            .profileVisibility(prefs.getProfileVisibility().name())
            .faceEmbedding(faceEmbedding)
            .createdAt(user.getCreatedAt())
            .lastSeen(user.getLastSeen())
            .build();
    
    // Save to Elasticsearch
    userSearchRepository.save(userDoc);
}
```

### Post Synchronization

Similar process for posts:

```java
@Transactional(readOnly = true)
public void syncAllPosts() {
    long totalPosts = postRepository.count();
    int pageNumber = 0;
    int syncedCount = 0;
    
    while (true) {
        Pageable pageable = PageRequest.of(pageNumber, BATCH_SIZE);
        Page<Post> postPage = postRepository.findAll(pageable);
        
        if (postPage.isEmpty()) break;
        
        for (Post post : postPage.getContent()) {
            syncPostToElasticsearch(post);
            syncedCount++;
        }
        
        if (!userPage.hasNext()) break;
        pageNumber++;
    }
    
    log.info("Post sync completed: {} synced", syncedCount);
}

private void syncPostToElasticsearch(Post post) {
    // Build nested author object
    PostDocument.Author author = PostDocument.Author.builder()
            .userId(post.getUser().getUserId())
            .username(post.getUser().getUsername())
            .profilePictureUrl(post.getUser().getProfilePictureUrl())
            .build();
    
    // Build nested category objects
    List<PostDocument.Category> categories = post.getCategories().stream()
            .map(cat -> PostDocument.Category.builder()
                    .categoryId(cat.getCategoryId())
                    .name(cat.getName())
                    .build())
            .collect(Collectors.toList());
    
    // Extract ML tags from media
    List<String> mlTags = extractMlTags(post);
    Integer peopleCount = countPeople(post);
    
    // Build PostDocument
    PostDocument postDoc = PostDocument.builder()
            .id(post.getPostId().toString())
            .postId(post.getPostId())
            .title(post.getTitle())
            .body(post.getBody())
            .summary(post.getSummary())
            .visibility(post.getVisibility())
            .status(post.getStatus())
            .createdAt(post.getCreatedAt())
            .author(author)
            .categories(categories)
            .reactionCount(post.getReactionCount())
            .commentCount(post.getCommentCount())
            .viewCount(post.getViewCount())
            .mlImageTags(mlTags)
            .peopleCount(peopleCount)
            .build();
    
    // Save to Elasticsearch
    postSearchRepository.save(postDoc);
}
```

### Real-Time Updates

For real-time synchronization after startup, services update Elasticsearch whenever entities change:

```java
// In UserService
public User updateUser(Long userId, UserUpdateDTO dto) {
    User user = userRepository.findById(userId).orElseThrow();
    // ... update user fields
    user = userRepository.save(user);
    
    // Update Elasticsearch
    elasticsearchSyncService.syncUserToElasticsearch(user);
    
    return user;
}

// In PostService
public Post createPost(PostCreateDTO dto) {
    Post post = // ... create post
    post = postRepository.save(post);
    
    // Update Elasticsearch
    elasticsearchSyncService.syncPostToElasticsearch(post);
    
    return post;
}
```

## Search Operations

### Basic User Search

```java
// Find active users with username containing "john"
Page<UserDocument> users = userSearchRepository.findFilteredUsers(
    "ACTIVE",           // status filter
    "john",             // search term
    PageRequest.of(0, 20)
);
```

### Basic Post Search

```java
// Find public posts with title/body containing "travel"
Page<PostDocument> posts = postSearchRepository.findVisibleAndFilteredPosts(
    currentUserId,      // current user
    followingIds,       // users being followed
    null,               // userId filter
    null,               // categoryId filter
    PostStatus.PUBLISHED,
    PostVisibility.PUBLIC,
    "travel",           // search query
    PageRequest.of(0, 20)
);
```

### Taggable Users Search

Find users that can be tagged (active, public tagging, not blocked):

```java
Page<UserDocument> taggableUsers = userSearchRepository.findTaggableUsers(
    currentUserId,
    blockedUserIds,
    blockedByUserIds,
    "jane",             // search query
    PageRequest.of(0, 10)
);
```

## Advanced Queries

### Follow Suggestions with Function Score

The most complex query uses Elasticsearch's `function_score` to rank users for follow suggestions based on multiple factors:

```java
Page<UserDocument> suggestions = userSearchRepository.findFollowSuggestions(
    targetUserId,               // User to generate suggestions for
    exclusions,                 // Users to exclude (already following)
    blockedUserIds,             // Blocked users
    blockedByUserIds,           // Users who blocked target
    friendsOfFriendsIds,        // Users followed by target's following
    targetUserInterests,        // Target user's interest IDs
    targetUserDesignation,      // Target user's job title
    PageRequest.of(0, 10)
);
```

**Scoring Factors**:

1. **Friends of Friends** (Weight: 10.0)
   - Users followed by people the target follows
   - Highest priority for social connections

2. **Shared Interests** (Weight: 5.0)
   - Users with overlapping interests/categories
   - Medium priority for content relevance

3. **Similar Designation** (Weight: 2.0)
   - Users with same job title/profession
   - Low priority for professional connections

4. **Popularity Boost** (Weight: 1.5)
   - Users with high follower counts
   - Cold start solution for new users

5. **Recency Boost** (Weight: 1.2)
   - Recently active users
   - Encourages engagement with active community

**Implementation**:

```java
private List<FunctionScore> buildScoringFunctions(
        Set<Long> followingIds, List<Long> interestIds) {
    
    List<FunctionScore> functions = new ArrayList<>();
    
    // 1. Friends of Friends (highest weight)
    if (followingIds != null && !followingIds.isEmpty()) {
        functions.add(FunctionScore.of(fs -> fs
                .filter(Query.of(q -> q.terms(t -> t
                        .field("userId")
                        .terms(tv -> tv.value(followingIds.stream()
                                .map(FieldValue::of)
                                .toList())))))
                .weight(10.0)
        ));
    }
    
    // 2. Shared Interests
    if (interestIds != null && !interestIds.isEmpty()) {
        functions.add(FunctionScore.of(fs -> fs
                .filter(Query.of(q -> q.terms(t -> t
                        .field("interests")
                        .terms(tv -> tv.value(interestIds.stream()
                                .map(FieldValue::of)
                                .toList())))))
                .weight(5.0)
        ));
    }
    
    // 3. Popularity (follower count)
    functions.add(FunctionScore.of(fs -> fs
            .fieldValueFactor(fvf -> fvf
                    .field("followerCount")
                    .factor(1.5)
                    .modifier(FieldValueFactorModifier.Log1p)
                    .missing(0.0))
    ));
    
    return functions;
}
```

### Post Suggestions with Engagement Scoring

Similar function score query for personalized post recommendations:

```java
Page<PostDocument> postSuggestions = postSearchRepository.findPostSuggestions(
    currentUserId,
    followingIds,
    interestIds,
    blockedUserIds,
    blockedByUserIds,
    viewedPostIds,              // Exclude already viewed posts
    PageRequest.of(0, 20)
);
```

**Scoring Factors**:
- Posts from followed users (high weight)
- Posts in user's interest categories (medium weight)
- Posts with high engagement (reactions, comments)
- Recent posts (freshness boost)

## Performance Optimization

### Indexing Strategy

**Field Types**:
- **Keyword**: Exact matching (username, email, status)
- **Text**: Full-text search with analysis (title, body, designation)
- **Nested**: Complex objects that need separate scoring
- **Object**: Simple embedded objects (author info)
- **Dense_Vector**: ML embeddings for similarity search

**Best Practices**:
1. Use `keyword` for filtering and aggregations
2. Use `text` for full-text search
3. Use `nested` when you need to query within list items independently
4. Disable `_source` for very large documents (if only IDs needed)
5. Set `fielddata=true` sparingly (only for sorting/aggregations on text fields)

### Query Optimization

**1. Use Filters Instead of Queries When Possible**:
```java
// Filter (cached, faster)
boolQueryBuilder.filter(Query.of(q -> q.term(t -> t
        .field("status")
        .value("ACTIVE")
)));

// vs Query (scored, slower)
boolQueryBuilder.must(Query.of(q -> q.term(t -> t
        .field("status")
        .value("ACTIVE")
)));
```

**2. Limit Result Size**:
```java
// Good: Pagination
Pageable pageable = PageRequest.of(0, 20);

// Bad: Large pages
Pageable pageable = PageRequest.of(0, 10000); // Avoid!
```

**3. Use `_source` Filtering**:
```java
// Only fetch needed fields
NativeQuery nativeQuery = NativeQuery.builder()
        .withQuery(query)
        .withSourceFilter(new FetchSourceFilter(
                new String[]{"userId", "username", "profilePictureUrl"}, 
                null
        ))
        .build();
```

**4. Batch Writes**:
```java
// Good: Batch save
List<UserDocument> documents = ...;
userSearchRepository.saveAll(documents);

// Bad: Individual saves in loop
for (UserDocument doc : documents) {
    userSearchRepository.save(doc); // Creates separate requests
}
```

### Resource Management

**Docker Configuration**:
- **Heap Size**: 1GB (`-Xms1g -Xmx1g`)
- **Memory Limit**: 2GB container limit
- **CPU Limit**: 1.0 CPU
- **Disk**: Persistent volume for data

**Monitoring**:
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health

# Check index stats
curl http://localhost:9200/users/_stats

# Check node stats
curl http://localhost:9200/_nodes/stats
```

## Monitoring & Maintenance

### Health Checks

**Cluster Health**:
```bash
curl http://localhost:9200/_cluster/health?pretty
```

**Expected Response**:
```json
{
  "cluster_name": "docker-cluster",
  "status": "green",
  "timed_out": false,
  "number_of_nodes": 1,
  "number_of_data_nodes": 1,
  "active_primary_shards": 12,
  "active_shards": 12,
  "relocating_shards": 0,
  "initializing_shards": 0,
  "unassigned_shards": 0
}
```

**Status Meanings**:
- **Green**: All shards allocated and operational
- **Yellow**: Primary shards operational, some replicas unassigned
- **Red**: Some primary shards unassigned (data loss)

### Index Management

**List All Indices**:
```bash
curl http://localhost:9200/_cat/indices?v
```

**Get Index Mapping**:
```bash
curl http://localhost:9200/users/_mapping?pretty
```

**Get Index Settings**:
```bash
curl http://localhost:9200/users/_settings?pretty
```

**Delete Index** (use with caution):
```bash
curl -X DELETE http://localhost:9200/users
```

### Re-indexing

If you need to rebuild indices from scratch:

**Option 1: Restart Application** (automatic sync):
```bash
# Stop application
# Delete Elasticsearch data (optional)
docker-compose down -v
# Start services
docker-compose up -d
# Application will auto-sync on startup
```

**Option 2: Manual Trigger** (if you expose a management endpoint):
```java
@RestController
@RequestMapping("/admin/elasticsearch")
public class ElasticsearchAdminController {
    
    private final ElasticsearchStartupSyncService syncService;
    
    @PostMapping("/sync-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> syncUsers() {
        syncService.syncAllUsers();
        return ResponseEntity.ok("User sync initiated");
    }
    
    @PostMapping("/sync-posts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> syncPosts() {
        syncService.syncAllPosts();
        return ResponseEntity.ok("Post sync initiated");
    }
}
```

### Performance Metrics

**Key Metrics to Monitor**:
1. **Query Latency**: Time to execute searches
2. **Indexing Rate**: Documents indexed per second
3. **Heap Usage**: JVM memory consumption
4. **Query Cache Hit Rate**: Effectiveness of caching
5. **Index Size**: Disk space used per index

**Logging**:
```java
// In custom repositories
log.info("Elasticsearch query returned {} results out of {} total hits", 
         documents.size(), searchHits.getTotalHits());
```

## Troubleshooting

### Common Issues

**1. Connection Refused**:
```
Error: Connection refused to http://localhost:9200
```

**Solution**:
- Check if Elasticsearch container is running: `docker ps`
- Check health: `curl http://localhost:9200/_cluster/health`
- Check logs: `docker logs kaleidoscope-elasticsearch`
- Verify `SPRING_ELASTICSEARCH_URIS` environment variable

**2. Index Not Found**:
```
Error: index_not_found_exception: no such index [users]
```

**Solution**:
- Indices are created automatically on first document save
- Trigger startup sync or manually create index
- Check application logs for sync errors

**3. Mapping Conflicts**:
```
Error: mapper_parsing_exception: failed to parse field [fieldName]
```

**Solution**:
- Field type mismatch between document and existing mapping
- Delete index and re-sync, or update document model
- Use dynamic mapping carefully

**4. Out of Memory**:
```
Error: CircuitBreakingException: [parent] Data too large
```

**Solution**:
- Increase heap size in docker-compose.yml: `-Xms2g -Xmx2g`
- Reduce query result size (use pagination)
- Optimize queries (use filters instead of queries)

**5. Slow Queries**:
```
Queries taking >1 second
```

**Solution**:
- Enable slow query logging
- Analyze query structure (use `_explain` API)
- Add more filters to reduce search scope
- Consider index optimization (refresh interval, merge policy)

### Debug Tools

**Explain API** (understand scoring):
```bash
curl -X POST "http://localhost:9200/users/_explain/1" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "username": "john"
    }
  }
}'
```

**Profile API** (identify slow operations):
```bash
curl -X POST "http://localhost:9200/users/_search" -H 'Content-Type: application/json' -d'
{
  "profile": true,
  "query": {
    "match_all": {}
  }
}'
```

**Analyze API** (test analyzers):
```bash
curl -X POST "http://localhost:9200/users/_analyze" -H 'Content-Type: application/json' -d'
{
  "field": "username",
  "text": "john_doe"
}'
```

## Conclusion

Elasticsearch is a critical component of Kaleidoscope, enabling fast, flexible search across users, posts, and other content. The integration demonstrates several best practices:

✅ **Automatic Synchronization**: Startup sync ensures data consistency  
✅ **Custom Repositories**: Complex queries with security filtering  
✅ **Function Score Queries**: Advanced ranking for recommendations  
✅ **Type Safety**: Strongly-typed document models with Spring Data  
✅ **Performance**: Optimized indexing and query strategies  
✅ **Scalability**: Docker deployment with resource limits  
✅ **Maintainability**: Clear separation of concerns and logging

### Key Takeaways

1. **PostgreSQL is the source of truth** - Elasticsearch is a search index
2. **Sync on startup** - Ensures data consistency after deployments
3. **Use appropriate field types** - Keyword for filters, Text for search
4. **Leverage function score** - For intelligent ranking and recommendations
5. **Monitor health** - Regular checks of cluster and index status
6. **Optimize queries** - Use filters, pagination, and source filtering
7. **Plan for growth** - Resource limits and scaling strategies

By following this architecture and best practices, the Kaleidoscope application achieves fast, relevant search results while maintaining data integrity and system performance.

