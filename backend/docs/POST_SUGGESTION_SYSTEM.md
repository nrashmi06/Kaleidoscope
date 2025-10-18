# Kaleidoscope Post Suggestion System Documentation

## Overview
The Kaleidoscope Post Suggestion System provides intelligent, personalized content recommendations using a multi-factor scoring algorithm powered by Elasticsearch. It leverages social connections, user interests, content engagement metrics, and viewing history to suggest relevant posts while filtering out already-viewed content using Redis.

## Architecture Components

### Core Technologies
- **Elasticsearch**: Advanced search and scoring engine with function_score queries
- **Spring Data Elasticsearch**: Elasticsearch integration
- **Redis**: Viewed posts tracking with automatic expiry
- **PostgreSQL**: Social graph storage (Follow relationships)
- **Function Score Query**: Multi-criteria ranking algorithm

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   Posts API      │    │   Elasticsearch     │
│   (Feed)        │───▶│   Controller     │───▶│   (PostDocument)    │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                          │
                                ▼                          │
                       ┌──────────────────┐                │
                       │ Suggestion Svc   │                │
                       │ - Scoring        │                │
                       │ - Filtering      │                │
                       └──────────────────┘                │
                                │                          │
                                ▼                          │
                       ┌──────────────────┐                │
                       │   Redis Cache    │                │
                       │ - Viewed Posts   │                │
                       │ - 7-day expiry   │                │
                       └──────────────────┘                │
                                │                          │
                                ▼                          │
                       ┌──────────────────┐                │
                       │   PostgreSQL     │◀───────────────┘
                       │   - Follows      │   (Sync Service)
                       │   - User Blocks  │
                       └──────────────────┘
```

### View Tracking Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   User Views    │    │   PostService    │    │   Redis             │
│   Post Detail   │───▶│   getPostById()  │───▶│   SET Operation     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                          │
                                │                          ▼
                                │                 ┌─────────────────────┐
                                │                 │ viewed_posts:userId │
                                │                 │ - postId1           │
                                │                 │ - postId2           │
                                │                 │ TTL: 7 days         │
                                │                 └─────────────────────┘
                                ▼
                       ┌──────────────────┐
                       │   Async Task     │
                       │ - Non-blocking   │
                       │ - Error tolerant │
                       └──────────────────┘
```

## Component Structure

```
posts/
├── controller/
│   └── PostController.java                # Suggestions endpoint
├── service/
│   ├── PostSuggestionService.java         # Suggestions interface
│   ├── impl/
│   │   ├── PostSuggestionServiceImpl.java # Algorithm implementation
│   │   └── PostServiceImpl.java           # View tracking logic
│   └── PostViewService.java               # View count service
├── repository/
│   └── search/
│       ├── PostSearchRepository.java      # Elasticsearch repository
│       ├── PostSearchRepositoryCustom.java # Custom query interface
│       └── PostSearchRepositoryImpl.java  # Function score implementation
├── document/
│   └── PostDocument.java                  # Elasticsearch post index
├── dto/
│   └── response/
│       └── PostSummaryResponseDTO.java    # Suggestion response format
├── routes/
│   └── PostsRoutes.java                   # API route constants
└── mapper/
    └── PostMapper.java                    # Document-DTO mapping
```

## Core Data Models

### PostDocument (Elasticsearch)
Searchable post document with engagement metrics:

```java
@Document(indexName = "posts")
public class PostDocument {
    private String id;                     // Elasticsearch document ID
    private Long postId;                   // PostgreSQL post ID
    private String title;                  // Post title
    private String body;                   // Post content
    private String summary;                // Post summary
    private String thumbnailUrl;           // First media thumbnail
    private PostVisibility visibility;     // PUBLIC, FOLLOWERS
    private PostStatus status;             // PUBLISHED, DRAFT, ARCHIVED
    private LocalDateTime createdAt;       // Publication timestamp
    
    // Nested Author Object
    private Author author;                 // Denormalized author data
    
    // Nested Categories
    private List<Category> categories;     // Post categories
    
    // Engagement Metrics
    private long reactionCount;            // Total reactions
    private long commentCount;             // Total comments
    private Long viewCount;                // Total views
    
    // ML-Generated Data
    private List<String> mlImageTags;      // AI-generated tags
    private Integer peopleCount;           // Detected people count
}
```

**Nested Objects:**
```java
public static class Author {
    private Long userId;
    private String username;
    private String profilePictureUrl;
    private String email;
    private String accountStatus;
}

public static class Category {
    private Long categoryId;
    private String name;
}
```

### Redis Data Structure
**Key Pattern:** `viewed_posts:{userId}`
**Type:** SET
**TTL:** 7 days (604800 seconds)
**Values:** Post IDs as strings

```
Key: "viewed_posts:123"
Members: ["45", "78", "102", "156"]
TTL: 7 days
```

## API Endpoints

### Get Post Suggestions
**Endpoint:** `GET /api/posts/suggestions`

**Authentication:** Required (JWT)

**Query Parameters:**
- `page` (optional, default: 0) - Page number
- `size` (optional, default: 20) - Page size
- `sort` (optional) - Sort criteria (e.g., `createdAt,desc`)

**Request Example:**
```http
GET /api/posts/suggestions?page=0&size=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "message": "Post suggestions retrieved successfully.",
  "data": {
    "content": [
      {
        "postId": 156,
        "title": "Amazing sunset at the beach",
        "summary": "Beautiful evening capturing nature's beauty",
        "thumbnailUrl": "https://cdn.example.com/posts/156/thumb.jpg",
        "visibility": "PUBLIC",
        "status": "PUBLISHED",
        "createdAt": "2025-10-18T14:30:00",
        "author": {
          "userId": 45,
          "username": "naturelover",
          "profilePictureUrl": "https://cdn.example.com/users/45.jpg"
        },
        "categories": [
          {"categoryId": 12, "name": "Photography"},
          {"categoryId": 23, "name": "Nature"}
        ],
        "reactionCount": 234,
        "commentCount": 45,
        "viewCount": 1520
      }
    ],
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 150,
    "totalPages": 8,
    "first": true,
    "last": false
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: User document not found in Elasticsearch

## Scoring Algorithm

### Overview
The system uses Elasticsearch's `function_score` query to calculate relevance scores based on multiple factors. Scores are combined using **SUM** mode and **MULTIPLY** boost mode.

### Scoring Formula
```
Final Score = Base Query Score × (Σ Function Scores)
```

### Scoring Functions

#### 1. Following Boost (Weight: 10.0)
**Purpose:** Prioritize posts from users the current user follows

**Implementation:**
```java
FunctionScore.of(f -> f
    .filter(TermsQuery.of(ts -> ts
        .field("author.userId")
        .terms(followingIds)))
    .weight(10.0)
)
```

**Example:**
- User follows 50 people
- Post from followed user → +10.0 score boost
- Post from non-followed user → 0 boost

#### 2. Interest Match Boost (Weight: 5.0)
**Purpose:** Boost posts in categories matching user interests

**Implementation:**
```java
FunctionScore.of(f -> f
    .filter(NestedQuery.of(n -> n
        .path("categories")
        .query(TermsQuery.of(ts -> ts
            .field("categories.categoryId")
            .terms(interestIds)))))
    .weight(5.0)
)
```

**Example:**
- User interested in: Photography, Travel, Nature
- Post categories: Photography, Landscape → +5.0 boost
- Post categories: Cooking, Food → 0 boost

#### 3. Popularity Boost (Weight: 2.0)
**Purpose:** Boost posts with high reaction engagement

**Implementation:**
```java
FunctionScore.of(f -> f
    .fieldValueFactor(fvf -> fvf
        .field("reactionCount")
        .factor(1.2)
        .modifier(FieldValueFactorModifier.Log1p)
        .missing(0.0))
    .weight(2.0)
)
```

**Formula:** `2.0 × log(1 + reactionCount × 1.2)`

**Example:**
- Post with 100 reactions → 2.0 × log(121) ≈ 9.6
- Post with 10 reactions → 2.0 × log(13) ≈ 5.1
- Post with 0 reactions → 2.0 × log(1) = 0

#### 4. Engagement Boost (Weight: 1.5)
**Purpose:** Boost posts with high comment activity

**Implementation:**
```java
FunctionScore.of(f -> f
    .fieldValueFactor(fvf -> fvf
        .field("commentCount")
        .factor(1.5)
        .modifier(FieldValueFactorModifier.Log1p)
        .missing(0.0))
    .weight(1.5)
)
```

**Formula:** `1.5 × log(1 + commentCount × 1.5)`

#### 5. View Count Boost (Weight: 1.0)
**Purpose:** Boost trending posts with high view counts

**Implementation:**
```java
FunctionScore.of(f -> f
    .fieldValueFactor(fvf -> fvf
        .field("viewCount")
        .factor(0.1)
        .modifier(FieldValueFactorModifier.Log1p)
        .missing(0.0))
    .weight(1.0)
)
```

**Formula:** `1.0 × log(1 + viewCount × 0.1)`

### Filtering Logic

#### Must NOT Filters (Exclusions)
1. **Own Posts:** User's own posts are excluded
2. **Blocked Users:** Posts from users blocked by current user
3. **Blocked By Users:** Posts from users who blocked current user
4. **Viewed Posts:** Posts recently viewed by user (Redis-tracked)

#### Must Filters (Requirements)
1. **Published Only:** Only posts with `status = PUBLISHED`

**Implementation:**
```java
BoolQuery.Builder filterBuilder = new BoolQuery.Builder();

// Exclude own posts
filterBuilder.mustNot(TermQuery.of(t -> t
    .field("author.userId")
    .value(currentUserId)));

// Exclude blocked users
filterBuilder.mustNot(TermsQuery.of(ts -> ts
    .field("author.userId")
    .terms(blockedUserIds)));

// Exclude users who blocked current user
filterBuilder.mustNot(TermsQuery.of(ts -> ts
    .field("author.userId")
    .terms(blockedByUserIds)));

// Exclude recently viewed posts
if (!viewedPostIds.isEmpty()) {
    filterBuilder.mustNot(TermsQuery.of(ts -> ts
        .field("postId")
        .terms(viewedPostIds)));
}

// Only published posts
filterBuilder.must(TermQuery.of(t -> t
    .field("status")
    .value("PUBLISHED")));
```

### Complete Query Structure

```json
{
  "query": {
    "function_score": {
      "query": {
        "bool": {
          "must": [
            { "term": { "status": "PUBLISHED" } }
          ],
          "must_not": [
            { "term": { "author.userId": 123 } },
            { "terms": { "author.userId": [45, 67, 89] } },
            { "terms": { "postId": [101, 202, 303] } }
          ]
        }
      },
      "functions": [
        {
          "filter": { "terms": { "author.userId": [following_ids] } },
          "weight": 10.0
        },
        {
          "filter": {
            "nested": {
              "path": "categories",
              "query": { "terms": { "categories.categoryId": [interest_ids] } }
            }
          },
          "weight": 5.0
        },
        {
          "field_value_factor": {
            "field": "reactionCount",
            "factor": 1.2,
            "modifier": "log1p",
            "missing": 0.0
          },
          "weight": 2.0
        },
        {
          "field_value_factor": {
            "field": "commentCount",
            "factor": 1.5,
            "modifier": "log1p",
            "missing": 0.0
          },
          "weight": 1.5
        },
        {
          "field_value_factor": {
            "field": "viewCount",
            "factor": 0.1,
            "modifier": "log1p",
            "missing": 0.0
          },
          "weight": 1.0
        }
      ],
      "score_mode": "sum",
      "boost_mode": "multiply"
    }
  }
}
```

## View Tracking System

### Purpose
Track which posts users have viewed to prevent showing the same content repeatedly in suggestions feed.

### Implementation

#### 1. Tracking View (PostServiceImpl)

**Method:** `trackPostViewAsync(Long userId, Long postId)`
**Execution:** Asynchronous (non-blocking)
**Trigger:** When user views post detail page

```java
@Async("taskExecutor")
public void trackPostViewAsync(Long userId, Long postId) {
    try {
        String viewedKey = "viewed_posts:" + userId;
        stringRedisTemplate.opsForSet().add(viewedKey, postId.toString());
        stringRedisTemplate.expire(viewedKey, 7, TimeUnit.DAYS);
        log.debug("Tracked viewed post {} for user {} in Redis with 7-day expiry", 
                  postId, userId);
    } catch (Exception e) {
        log.error("Failed to track viewed post {} for user {} in Redis: {}", 
                  postId, userId, e.getMessage());
        // Don't throw - this is a non-critical feature
    }
}
```

**Characteristics:**
- **Asynchronous:** Doesn't block the main response
- **Error Tolerant:** Failures don't affect post viewing
- **Auto-Expiring:** Redis SET expires after 7 days
- **Idempotent:** Adding same post multiple times has no effect

#### 2. Retrieving Viewed Posts (PostSuggestionServiceImpl)

```java
Set<String> viewedPostIds;
try {
    String viewedKey = "viewed_posts:" + currentUserId;
    viewedPostIds = stringRedisTemplate.opsForSet().members(viewedKey);
    if (viewedPostIds == null) {
        viewedPostIds = Collections.emptySet();
    }
    log.info("Retrieved {} viewed post IDs from Redis for user {}", 
             viewedPostIds.size(), currentUserId);
} catch (Exception e) {
    log.error("Failed to fetch viewed post IDs from Redis: {}", e.getMessage());
    viewedPostIds = Collections.emptySet();
}
```

**Characteristics:**
- **Graceful Degradation:** Empty set on Redis failure
- **Fast Retrieval:** O(N) where N is set size
- **Memory Efficient:** Only stores post IDs as strings

#### 3. Filtering in Elasticsearch

```java
if (viewedPostIds != null && !viewedPostIds.isEmpty()) {
    log.debug("Adding filter to exclude {} recently viewed post IDs", 
              viewedPostIds.size());
    
    // Convert String IDs to Long
    List<FieldValue> viewedIdsAsFieldValue = viewedPostIds.stream()
        .map(idStr -> {
            try {
                return FieldValue.of(Long.parseLong(idStr));
            } catch (NumberFormatException e) {
                log.warn("Invalid post ID in viewed set: {}", idStr);
                return null;
            }
        })
        .filter(Objects::nonNull)
        .toList();

    filterBuilder.mustNot(TermsQuery.of(ts -> ts
        .field("postId")
        .terms(t -> t.value(viewedIdsAsFieldValue))));
}
```

### Redis Key Management

**Key Pattern:** `viewed_posts:{userId}`

**Operations:**
- **SADD:** Add post ID to user's viewed set
- **EXPIRE:** Set/reset 7-day TTL
- **SMEMBERS:** Retrieve all viewed post IDs
- **DEL:** Automatically deleted after 7 days

**Example Redis Commands:**
```redis
# Track view
SADD viewed_posts:123 "456"
EXPIRE viewed_posts:123 604800

# Retrieve viewed posts
SMEMBERS viewed_posts:123
# Returns: ["456", "789", "101"]

# Check membership
SISMEMBER viewed_posts:123 "456"
# Returns: 1 (true)
```

## Service Layer Implementation

### PostSuggestionService

**Interface:**
```java
public interface PostSuggestionService {
    PaginatedResponse<PostSummaryResponseDTO> getPostSuggestions(Pageable pageable);
}
```

**Implementation Flow:**

```
1. Get Current User ID
        ↓
2. Fetch UserDocument from Elasticsearch
   - Extract interests
   - Extract blocked users
   - Extract blocked-by users
        ↓
3. Get Following IDs from PostgreSQL
        ↓
4. Fetch Viewed Post IDs from Redis
   - Key: "viewed_posts:{userId}"
   - Graceful fallback on error
        ↓
5. Execute Elasticsearch Function Score Query
   - Apply all filters
   - Calculate scores
   - Sort by relevance
        ↓
6. Map PostDocument → PostSummaryResponseDTO
        ↓
7. Return Paginated Response
```

### PostServiceImpl - View Tracking

**Tracking Trigger:**
```java
@Override
@Transactional(readOnly = true)
public PostDetailResponseDTO getPostById(Long postId) {
    // ... fetch and validate post ...
    
    // Track view count (Redis optimization)
    if (!isOwner) {
        postViewService.incrementViewAsync(postId, currentUserId);
        
        // Track this post as viewed for suggestions filtering
        trackPostViewAsync(currentUserId, postId);
    }
    
    // ... return post details ...
}
```

**Key Characteristics:**
- Tracks views only for non-owners
- Asynchronous execution (doesn't block response)
- Separate from view count incrementing
- Error-tolerant (failures logged but not thrown)

## Performance Considerations

### Elasticsearch Optimization

**Index Settings:**
- Posts indexed in real-time after creation
- Denormalized author and category data for fast queries
- No JOIN operations required

**Query Performance:**
- Function score queries cached by Elasticsearch
- Filter context (must/must_not) is cacheable
- Field value factors use log1p for score normalization

**Expected Performance:**
- < 50ms for typical queries
- < 100ms for users with many interests/follows
- Scales horizontally with Elasticsearch cluster

### Redis Optimization

**Memory Usage:**
- Per user: ~50 bytes per viewed post
- 100 viewed posts = ~5KB per user
- 10,000 active users = ~50MB total

**Operation Performance:**
- SADD: O(1) per post ID
- SMEMBERS: O(N) where N = viewed posts
- Negligible latency (< 1ms)

**TTL Strategy:**
- 7-day expiry balances freshness vs. memory
- Automatic cleanup via Redis expiration
- No manual cleanup required

### Async Processing

**Benefits:**
- View tracking doesn't block post detail response
- Failed tracking doesn't affect user experience
- Dedicated thread pool for async operations

**Configuration:**
```java
@Async("taskExecutor")
```

Uses `taskExecutor` thread pool configured in application.

## Error Handling

### Graceful Degradation

**UserDocument Not Found:**
```java
if (userDocumentOpt.isEmpty()) {
    log.warn("UserDocument not found for userId: {}", currentUserId);
    return PaginatedResponse.fromPage(Page.empty(pageable));
}
```
**Result:** Returns empty suggestions instead of error

**Redis Connection Failure:**
```java
catch (Exception e) {
    log.error("Failed to fetch viewed post IDs from Redis: {}", e.getMessage());
    viewedPostIds = Collections.emptySet();
}
```
**Result:** Continues without viewed-post filtering

**View Tracking Failure:**
```java
catch (Exception e) {
    log.error("Failed to track viewed post in Redis: {}", e.getMessage());
    // Don't throw - this is a non-critical feature
}
```
**Result:** User experience unaffected, logged for monitoring

### Data Consistency

**Eventual Consistency:**
- Elasticsearch sync may lag behind PostgreSQL
- Acceptable for suggestion system (not transactional)
- Sync service updates documents periodically

**Redis Expiry:**
- Viewed posts automatically expire after 7 days
- Users may see repeated posts after expiry
- Trade-off between memory and user experience

## Testing Recommendations

### Unit Tests

**PostSuggestionServiceImpl:**
```java
@Test
void testGetPostSuggestions_WithInterestsAndFollows() {
    // Mock UserDocument with interests
    // Mock Following IDs
    // Mock Redis viewed posts
    // Verify query parameters passed to repository
    // Assert paginated response structure
}

@Test
void testGetPostSuggestions_RedisFailure_GracefulDegradation() {
    // Mock Redis to throw exception
    // Verify empty set used as fallback
    // Verify suggestions still returned
}

@Test
void testGetPostSuggestions_NoUserDocument_ReturnsEmpty() {
    // Mock UserSearchRepository.findById() returns empty
    // Verify empty page returned
}
```

**PostSearchRepositoryImpl:**
```java
@Test
void testFindPostSuggestions_FiltersOwnPosts() {
    // Query suggestions
    // Assert current user's posts excluded
}

@Test
void testFindPostSuggestions_FiltersViewedPosts() {
    // Pass viewed post IDs
    // Assert those posts excluded from results
}

@Test
void testFindPostSuggestions_BoostsFollowedUsers() {
    // Create posts from followed and non-followed users
    // Assert followed user posts ranked higher
}
```

**PostServiceImpl:**
```java
@Test
void testTrackPostViewAsync_Success() {
    // Mock StringRedisTemplate
    // Call trackPostViewAsync
    // Verify SADD and EXPIRE called
}

@Test
void testGetPostById_TriggersViewTracking() {
    // Mock post retrieval
    // Verify trackPostViewAsync called for non-owner
    // Verify not called for owner
}
```

### Integration Tests

**End-to-End Suggestion Flow:**
```java
@Test
@WithMockUser
void testPostSuggestionsEndpoint_ReturnsPersonalizedFeed() {
    // Given: User with interests and follows
    // When: GET /api/posts/suggestions
    // Then: Returns relevant posts, excludes blocked/viewed
}
```

**Redis Integration:**
```java
@Test
@SpringBootTest
void testViewTracking_PersistsToRedis() {
    // View post detail
    // Check Redis for key "viewed_posts:{userId}"
    // Assert post ID in set
    // Verify TTL set to 7 days
}
```

### Performance Tests

**Load Testing:**
- Test 1000 concurrent suggestion requests
- Measure p95, p99 latency
- Monitor Elasticsearch query performance
- Track Redis memory usage

**Stress Testing:**
- Users with 500+ follows
- Users with 50+ interests
- 1000+ viewed posts in Redis

## Monitoring and Observability

### Key Metrics

**Service Metrics:**
- Suggestion request rate (requests/sec)
- Average response time
- Cache hit rate (Elasticsearch query cache)
- Empty result rate

**Elasticsearch Metrics:**
- Query execution time
- Function score calculation time
- Index size and document count
- Query cache performance

**Redis Metrics:**
- Memory usage for viewed_posts keys
- Key count per user
- TTL distribution
- Operation latency (SADD, SMEMBERS)

### Logging

**Info Level:**
```java
log.info("Generating post suggestions for user: {}", currentUserId);
log.info("Retrieved {} viewed post IDs from Redis", viewedPostIds.size());
log.info("Found {} post suggestions", postDocuments.getTotalElements());
```

**Debug Level:**
```java
log.debug("User context - Interests: {}, Blocked: {}, BlockedBy: {}", ...);
log.debug("User is following {} users", followingIds.size());
log.debug("Tracked viewed post {} for user {}", postId, userId);
```

**Error Level:**
```java
log.error("Failed to fetch viewed post IDs from Redis: {}", e.getMessage());
log.error("Failed to track viewed post in Redis: {}", e.getMessage());
```

### Alerts

**Critical:**
- Elasticsearch cluster down
- Redis connection failure rate > 5%
- Suggestion endpoint error rate > 1%

**Warning:**
- Average response time > 200ms
- Empty result rate > 20%
- Redis memory usage > 80%

## Configuration

### Application Properties

```yaml
spring:
  data:
    elasticsearch:
      repositories:
        enabled: true
    redis:
      host: localhost
      port: 6379
      timeout: 2000ms

# Thread pool for async operations
spring:
  task:
    execution:
      pool:
        core-size: 5
        max-size: 10
        queue-capacity: 100
```

### Elasticsearch Index Mapping

```json
{
  "posts": {
    "mappings": {
      "properties": {
        "postId": { "type": "long" },
        "title": { "type": "text" },
        "status": { "type": "keyword" },
        "author": {
          "properties": {
            "userId": { "type": "long" },
            "username": { "type": "keyword" }
          }
        },
        "categories": {
          "type": "nested",
          "properties": {
            "categoryId": { "type": "long" },
            "name": { "type": "keyword" }
          }
        },
        "reactionCount": { "type": "long" },
        "commentCount": { "type": "long" },
        "viewCount": { "type": "long" }
      }
    }
  }
}
```

## Future Enhancements

### Machine Learning Integration
- Use ML model to predict user preferences
- Train on historical interaction data
- A/B test ML vs. rule-based scoring

### Advanced Filtering
- Time-based filtering (show posts from last N days)
- Diversity enforcement (mix of content types)
- Collaborative filtering (similar users' preferences)

### Performance Optimization
- Cache suggestion results (short TTL)
- Pre-compute scores for popular posts
- Batch processing for view tracking

### Analytics
- Track suggestion click-through rate
- Measure dwell time on suggested posts
- Analyze which scoring factors drive engagement

### User Controls
- Allow users to refresh suggestions
- "Not interested" feedback mechanism
- Explicit interest management

## Troubleshooting

### Common Issues

**Issue: Empty suggestions returned**
- Check UserDocument exists in Elasticsearch
- Verify user has interests or follows
- Check if all posts are in viewed_posts set

**Issue: Irrelevant suggestions**
- Review scoring weights in code
- Check user interests are up-to-date
- Verify Elasticsearch sync is working

**Issue: Redis memory growth**
- Verify TTL is being set (7 days)
- Check for Redis eviction policy
- Monitor key count per user

**Issue: Slow response time**
- Check Elasticsearch cluster health
- Review query cache hit rate
- Monitor concurrent request count

## Conclusion

The Post Suggestion System provides a sophisticated, performant, and scalable solution for personalized content discovery. By combining Elasticsearch's powerful scoring capabilities with Redis-based view tracking, it delivers relevant suggestions while preventing content fatigue. The system is designed with fault tolerance and graceful degradation to ensure a reliable user experience even under failure conditions.

