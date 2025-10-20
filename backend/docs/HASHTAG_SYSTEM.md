# Kaleidoscope Hashtag System Documentation

## Overview
The Kaleidoscope Hashtag System provides intelligent hashtag management, search capabilities, and trending content discovery. Hashtags are automatically parsed from post content, stored in the database, synchronized to Elasticsearch for efficient searching, and used to boost trending content in the post suggestion algorithm.

## Architecture Components

### Core Technologies
- **PostgreSQL**: Hashtag storage with usage tracking
- **Elasticsearch**: Fast hashtag-based post filtering
- **Redis Streams**: Asynchronous hashtag usage count updates
- **Spring Data JPA**: Hashtag entity management
- **Function Score Query**: Trending hashtag boost in suggestions

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   User Creates  │    │   PostService    │    │   HashtagService    │
│   Post with     │───▶│   createPost()   │───▶│   parseHashtags()   │
│   #hashtags     │    └──────────────────┘    └─────────────────────┘
└─────────────────┘             │                          │
                                │                          ▼
                                │                 ┌─────────────────────┐
                                │                 │ findOrCreateHashtags│
                                │                 │ - Finds existing    │
                                │                 │ - Creates new ones  │
                                │                 └─────────────────────┘
                                │                          │
                                ▼                          ▼
                       ┌──────────────────┐    ┌─────────────────────┐
                       │   PostgreSQL     │    │  associateHashtags  │
                       │   - posts        │◀───│  - Creates junction │
                       │   - hashtags     │    │  - Links to post    │
                       │   - post_hashtags│    └─────────────────────┘
                       └──────────────────┘                │
                                │                          │
                                │                          ▼
                                │                 ┌─────────────────────┐
                                │                 │  Redis Stream       │
                                │                 │  - Async updates    │
                                │                 │  - Usage count++    │
                                │                 └─────────────────────┘
                                ▼
                       ┌──────────────────┐
                       │  Elasticsearch   │
                       │  - PostDocument  │
                       │  - hashtags[]    │
                       └──────────────────┘
```

### Search and Discovery Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ User Searches   │    │   PostController │    │   PostService       │
│ Posts by        │───▶│   filterPosts()  │───▶│   filterPosts()     │
│ #hashtag        │    └──────────────────┘    └─────────────────────┘
└─────────────────┘                                       │
                                                          ▼
                                                 ┌─────────────────────┐
                                                 │ PostSearchRepository│
                                                 │ findVisibleAnd      │
                                                 │ FilteredPosts()     │
                                                 └─────────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────────┐
                                                 │  Elasticsearch      │
                                                 │  TermQuery on       │
                                                 │  hashtags field     │
                                                 └─────────────────────┘
```

### Trending Hashtag Boost Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ User Requests   │    │ Suggestion       │    │  HashtagService     │
│ Post Feed       │───▶│ Service          │───▶│  getTrendingHashtags│
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                          │
                                │                          ▼
                                │                 ┌─────────────────────┐
                                │                 │   PostgreSQL        │
                                │                 │   ORDER BY          │
                                │                 │   usage_count DESC  │
                                │                 └─────────────────────┘
                                ▼
                       ┌──────────────────┐
                       │  Elasticsearch   │
                       │  function_score  │
                       │  - Trending boost│
                       │  - Weight: 3.0   │
                       └──────────────────┘
```

## Component Structure

```
shared/
├── model/
│   ├── Hashtag.java                    # Main hashtag entity
│   └── PostHashtag.java                # Junction table entity
├── service/
│   ├── HashtagService.java             # Hashtag service interface
│   └── impl/
│       └── HashtagServiceImpl.java     # Implementation with async
├── repository/
│   ├── HashtagRepository.java          # Hashtag data access
│   └── PostHashtagRepository.java      # Junction table access
└── dto/
    └── response/
        └── HashtagResponseDTO.java     # Hashtag response format

posts/
├── document/
│   └── PostDocument.java               # includes hashtags field
├── repository/
│   └── search/
│       ├── PostSearchRepositoryCustom.java
│       └── PostSearchRepositoryImpl.java
└── service/
    └── impl/
        ├── PostServiceImpl.java        # Uses HashtagService
        └── PostSuggestionServiceImpl.java # Trending boost

elasticsearch/
└── sync/
    └── ElasticsearchStartupSyncService.java # Syncs hashtags to ES
```

## Core Data Models

### Hashtag Entity
The main hashtag entity with usage tracking:

```java
@Entity
@Table(name = "hashtags")
public class Hashtag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hashtag_id")
    private Long hashtagId;
    
    @Column(nullable = false, unique = true, length = 50)
    private String name;                   // Hashtag name (without #)
    
    @Column(name = "usage_count", nullable = false)
    private Integer usageCount = 0;        // How many posts use this tag
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;       // First time used
    
    @OneToMany(mappedBy = "hashtag")
    private Set<PostHashtag> postHashtags; // All posts using this tag
}
```

### PostHashtag Junction Entity
Links posts to hashtags:

```java
@Entity
@Table(name = "post_hashtags")
public class PostHashtag {
    @EmbeddedId
    private PostHashtagId id;              // Composite key
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    @JoinColumn(name = "post_id")
    private Post post;                     // The post
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("hashtagId")
    @JoinColumn(name = "hashtag_id")
    private Hashtag hashtag;               // The hashtag
    
    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;       // When association was made
}
```

### PostDocument (Elasticsearch)
Searchable post document with hashtags:

```java
@Document(indexName = "posts")
public class PostDocument {
    // ...existing fields...
    
    @Field(type = FieldType.Keyword)
    private List<String> hashtags;         // Hashtag names for searching
    
    // ...other fields...
}
```

## Hashtag Lifecycle

### 1. Hashtag Parsing
When a user creates or updates a post:

```java
// Automatically parse hashtags from post body
Set<String> hashtagNames = hashtagService.parseHashtags(postBody);

// Input:  "Just visited #Paris with #friends! #travel #photography"
// Output: ["Paris", "friends", "travel", "photography"]
```

**Parsing Rules:**
- Hashtags start with `#` symbol
- Followed by alphanumeric characters and underscores
- Case-insensitive (normalized to lowercase)
- Maximum 50 characters per hashtag
- Duplicates removed

### 2. Hashtag Creation/Retrieval
```java
List<Hashtag> hashtags = hashtagService.findOrCreateHashtags(hashtagNames);
```

**Logic:**
1. Check if hashtag exists in database
2. If exists: retrieve existing hashtag
3. If not exists: create new hashtag with `usageCount = 0`
4. Return list of hashtag entities

### 3. Post Association
```java
hashtagService.associateHashtagsWithPost(savedPost, new HashSet<>(hashtags));
```

**Process:**
1. Create `PostHashtag` junction entries
2. Link post and hashtag via composite key
3. Save to database

### 4. Usage Count Update (Async)
```java
hashtagService.triggerHashtagUsageUpdate(addedHashtags, removedHashtags);
```

**Asynchronous Update via Redis Stream:**
1. Publishes event to Redis Stream
2. Consumer processes event in background
3. Increments `usageCount` for added hashtags
4. Decrements `usageCount` for removed hashtags
5. Non-blocking operation

### 5. Elasticsearch Synchronization
```java
// In ElasticsearchStartupSyncService
List<String> hashtagNames = post.getPostHashtags().stream()
    .map(ph -> ph.getHashtag().getName())
    .collect(Collectors.toList());

PostDocument postDocument = PostDocument.builder()
    .hashtags(hashtagNames)
    // ...other fields...
    .build();
```

**Sync Points:**
- **Startup Sync**: All posts synced on application start
- **Real-time Sync**: New posts indexed immediately on creation
- **Update Sync**: Post updates trigger re-indexing

## Search and Filtering

### Filter Posts by Hashtag

**Endpoint:** `GET /api/posts?hashtag={name}`

**Example:**
```http
GET /api/posts?hashtag=travel&page=0&size=20
Authorization: Bearer {token}
```

**Implementation:**
```java
// In PostSearchRepositoryImpl
if (hashtag != null && !hashtag.trim().isEmpty()) {
    queryBuilder.must(TermQuery.of(t -> t
        .field("hashtags")
        .value(hashtag.trim()))._toQuery());
}
```

**Query Type:** Exact term match on Keyword field
**Performance:** O(1) lookup using inverted index

### Combined Filtering
You can combine hashtag filtering with other filters:

```http
GET /api/posts?hashtag=nature&categoryId=12&userId=45&page=0&size=20
```

**Filters Applied:**
- Hashtag: exact match on "nature"
- Category: posts in category 12
- User: posts by user 45
- Visibility: based on user's following status
- Status: PUBLISHED only

## Trending Hashtag Discovery

### Get Trending Hashtags

**Service Method:**
```java
Page<Hashtag> getTrendingHashtags(Pageable pageable);
```

**Implementation:**
```java
@Repository
public interface HashtagRepository extends JpaRepository<Hashtag, Long> {
    @Query("SELECT h FROM Hashtag h ORDER BY h.usageCount DESC, h.createdAt DESC")
    Page<Hashtag> findTrendingHashtags(Pageable pageable);
}
```

**Query:** Orders by usage count (descending), then by creation date

**Example Usage:**
```java
// Get top 10 trending hashtags
Page<Hashtag> trending = hashtagService.getTrendingHashtags(PageRequest.of(0, 10));
```

### Trending Hashtag Boost in Suggestions

**How It Works:**
1. When user requests post suggestions, system fetches top 10 trending hashtags
2. Passes trending hashtag names to Elasticsearch query
3. Posts containing trending hashtags receive 3.0x score boost
4. Results in trending content appearing higher in feed

**Implementation:**
```java
// In PostSuggestionServiceImpl
List<String> trendingHashtagNames = hashtagService
    .getTrendingHashtags(PageRequest.of(0, 10))
    .stream()
    .map(Hashtag::getName)
    .collect(Collectors.toList());

// Pass to repository
Page<PostDocument> posts = postSearchRepository.findPostSuggestions(
    currentUserId,
    followingIds,
    interestIds,
    blockedUserIds,
    blockedByUserIds,
    viewedPostIds,
    trendingHashtagNames,  // <- Trending hashtags
    pageable
);
```

**Elasticsearch Function Score:**
```java
// In PostSearchRepositoryImpl
if (trendingHashtagNames != null && !trendingHashtagNames.isEmpty()) {
    functions.add(FunctionScore.of(f -> f
        .filter(TermsQuery.of(ts -> ts
            .field("hashtags")
            .terms(t -> t.value(trendingHashtagNames.stream()
                .map(FieldValue::of)
                .toList())))._toQuery())
        .weight(3.0)
    ));
}
```

**Scoring Weight Hierarchy:**
1. Following users: **10.0x**
2. Interest categories: **5.0x**
3. **Trending hashtags: 3.0x** ← Moderate boost
4. Reaction count: **2.0x**
5. Comment count: **1.5x**
6. View count: **1.0x**

## API Endpoints

### 1. Get Trending Hashtags
```http
GET /api/hashtags/trending?page=0&size=10
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Trending hashtags retrieved successfully",
  "data": {
    "content": [
      {
        "hashtagId": 1,
        "name": "travel",
        "usageCount": 1543,
        "createdAt": "2025-09-15T10:30:00"
      },
      {
        "hashtagId": 2,
        "name": "photography",
        "usageCount": 1289,
        "createdAt": "2025-09-10T14:20:00"
      }
    ],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 45,
    "totalPages": 5
  }
}
```

### 2. Search Hashtags by Prefix
```http
GET /api/hashtags/suggestions?prefix=trav&page=0&size=5
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {"hashtagId": 1, "name": "travel", "usageCount": 1543},
      {"hashtagId": 12, "name": "traveling", "usageCount": 432},
      {"hashtagId": 23, "name": "travelphotography", "usageCount": 289}
    ]
  }
}
```

### 3. Filter Posts by Hashtag
```http
GET /api/posts?hashtag=nature&page=0&size=20
Authorization: Bearer {token}
```

### 4. Get Post Suggestions (with Trending Boost)
```http
GET /api/posts/suggestions?page=0&size=20
Authorization: Bearer {token}
```
*Posts with trending hashtags automatically boosted*

## Hashtag Update Scenarios

### Post Creation
```java
// User creates post with hashtags
PostCreateRequestDTO request = new PostCreateRequestDTO(
    "My Amazing Trip",
    "Just visited #Paris with #friends! #travel",
    // ...other fields
);

// System automatically:
// 1. Parses hashtags: ["Paris", "friends", "travel"]
// 2. Creates/finds hashtag entities
// 3. Associates with post
// 4. Triggers async usage count update
// 5. Indexes to Elasticsearch with hashtags
```

### Post Update
```java
// User updates post, changing hashtags
PostUpdateRequestDTO request = new PostUpdateRequestDTO(
    "My Amazing Trip",
    "Just visited #Paris! #photography",  // Changed hashtags
    // ...other fields
);

// System automatically:
// 1. Parses new hashtags: ["Paris", "photography"]
// 2. Compares with old hashtags: ["Paris", "friends", "travel"]
// 3. Added: ["photography"]
// 4. Removed: ["friends", "travel"]
// 5. Updates associations
// 6. Triggers async count update (increment added, decrement removed)
// 7. Re-indexes to Elasticsearch
```

### Post Deletion
```java
// User deletes post (soft delete)
postService.softDeletePost(postId);

// System automatically:
// 1. Retrieves post's hashtags
// 2. Triggers async usage count decrement
// 3. Removes from Elasticsearch index
// 4. Keeps hashtag entities in database (for historical data)
```

## Performance Optimization

### Database Indexes
```sql
-- Hashtag name index for fast lookups
CREATE UNIQUE INDEX idx_hashtags_name ON hashtags(name);

-- Usage count index for trending queries
CREATE INDEX idx_hashtags_usage_count ON hashtags(usage_count DESC);

-- Composite index for junction table
CREATE INDEX idx_post_hashtags_post_id ON post_hashtags(post_id);
CREATE INDEX idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);
```

### Elasticsearch Optimization
- **Field Type**: Keyword (not analyzed, exact match)
- **No fielddata required**: Efficient memory usage
- **Inverted index**: O(1) lookup performance
- **Term queries**: Fastest query type in Elasticsearch

### Caching Strategy
- Trending hashtags cached in Redis (optional future enhancement)
- Cache key: `trending_hashtags`
- TTL: 1 hour
- Invalidated on significant usage count changes

## Asynchronous Processing

### Redis Stream Event
```java
// Event Structure
{
  "eventType": "HASHTAG_USAGE_UPDATE",
  "timestamp": "2025-10-20T15:30:00Z",
  "addedHashtags": [
    {"id": 1, "name": "travel", "increment": 1},
    {"id": 5, "name": "photography", "increment": 1}
  ],
  "removedHashtags": [
    {"id": 3, "name": "food", "decrement": 1}
  ]
}
```

### Consumer Processing
```java
@StreamListener(target = "hashtag-updates")
public void processHashtagUpdate(HashtagUpdateEvent event) {
    // Increment usage counts
    for (Hashtag hashtag : event.getAddedHashtags()) {
        hashtagRepository.incrementUsageCount(hashtag.getHashtagId());
    }
    
    // Decrement usage counts
    for (Hashtag hashtag : event.getRemovedHashtags()) {
        hashtagRepository.decrementUsageCount(hashtag.getHashtagId());
    }
}
```

**Benefits:**
- Non-blocking post creation
- Eventual consistency
- Fault-tolerant with retry mechanism
- Scalable to high-volume operations

## Security Considerations

### Input Validation
- Maximum hashtag length: 50 characters
- Only alphanumeric and underscores allowed
- Case normalization prevents duplicates
- SQL injection prevention via parameterized queries

### Access Control
- Hashtag creation: automatic (no explicit permission needed)
- Hashtag viewing: public (no authentication required for trending)
- Hashtag deletion: admin only (via admin endpoint)
- Post filtering by hashtag: respects post visibility rules

### Rate Limiting
- Hashtag suggestions endpoint: 100 requests/minute per user
- Trending hashtags endpoint: 50 requests/minute per user
- Post creation with hashtags: follows post creation rate limits

## Monitoring and Analytics

### Key Metrics
1. **Total Hashtags**: Count of unique hashtags
2. **Active Hashtags**: Hashtags used in last 30 days
3. **Trending Velocity**: Rate of usage count increase
4. **Search Performance**: Elasticsearch query latency
5. **Sync Status**: Posts synced vs. total posts

### Elasticsearch Health
```bash
# Check index health
GET /posts/_search
{
  "query": {
    "exists": {
      "field": "hashtags"
    }
  }
}

# Aggregate hashtag usage
GET /posts/_search
{
  "size": 0,
  "aggs": {
    "popular_hashtags": {
      "terms": {
        "field": "hashtags",
        "size": 20
      }
    }
  }
}
```

### Database Queries
```sql
-- Top 20 trending hashtags
SELECT name, usage_count 
FROM hashtags 
ORDER BY usage_count DESC 
LIMIT 20;

-- Hashtags created today
SELECT COUNT(*) 
FROM hashtags 
WHERE DATE(created_at) = CURRENT_DATE;

-- Posts per hashtag distribution
SELECT h.name, COUNT(ph.post_id) as post_count
FROM hashtags h
LEFT JOIN post_hashtags ph ON h.hashtag_id = ph.hashtag_id
GROUP BY h.hashtag_id
ORDER BY post_count DESC;
```

## Troubleshooting

### Issue: Hashtags not appearing in search
**Possible Causes:**
1. Elasticsearch not synced
2. Post not indexed yet
3. Hashtag field missing in PostDocument

**Solutions:**
```bash
# Re-sync Elasticsearch
POST /admin/elasticsearch/sync

# Check specific post in ES
GET /posts/_doc/{postId}

# Verify hashtags field exists
GET /posts/_mapping
```

### Issue: Usage count not updating
**Possible Causes:**
1. Redis Stream consumer not running
2. Event publishing failed
3. Database transaction issues

**Solutions:**
```bash
# Check Redis Stream
XLEN hashtag-updates-stream

# Check consumer status
GET /admin/streams/status

# Manual count recalculation
POST /admin/hashtags/recalculate-counts
```

### Issue: Trending hashtags not boosting suggestions
**Possible Causes:**
1. Function score not applied
2. Weight too low
3. Elasticsearch query syntax error

**Solutions:**
```java
// Enable debug logging
logging.level.com.kaleidoscope.backend.posts.repository.search=DEBUG

// Check function score in logs
// Verify trendingHashtagNames is populated
```

## Future Enhancements

1. **Hashtag Analytics Dashboard**
   - Hashtag usage trends over time
   - Engagement metrics per hashtag
   - User demographics per hashtag

2. **Related Hashtags**
   - Suggest related hashtags based on co-occurrence
   - Machine learning for hashtag recommendations

3. **Hashtag Moderation**
   - Block inappropriate hashtags
   - Merge duplicate/similar hashtags
   - Admin approval for new trending hashtags

4. **Advanced Search**
   - Boolean operators (AND, OR, NOT)
   - Multiple hashtag filtering
   - Hashtag + text search combination

5. **Hashtag Following**
   - Users can follow specific hashtags
   - Personalized feed based on followed hashtags
   - Notifications for new posts with followed hashtags

## Conclusion

The Kaleidoscope Hashtag System provides a robust, scalable solution for hashtag management and discovery. By combining PostgreSQL for reliable storage, Elasticsearch for fast searching, and Redis Streams for asynchronous processing, the system delivers excellent performance while maintaining data consistency.

**Key Features:**
✅ Automatic hashtag parsing and creation
✅ Fast hashtag-based post filtering
✅ Trending hashtag discovery
✅ Intelligent content boosting in suggestions
✅ Asynchronous usage count updates
✅ Real-time Elasticsearch synchronization
✅ Comprehensive API endpoints

For additional information, see:
- [POST_SUGGESTION_SYSTEM.md](./POST_SUGGESTION_SYSTEM.md) - Suggestion algorithm details
- [ELASTICSEARCH_INTEGRATION.md](./ELASTICSEARCH_INTEGRATION.md) - Elasticsearch setup
- [POSTS_SYSTEM.md](./POSTS_SYSTEM.md) - Post management overview

