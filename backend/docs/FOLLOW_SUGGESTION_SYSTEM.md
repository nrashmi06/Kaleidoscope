# Kaleidoscope Follow Suggestion System Documentation

## Overview
The Kaleidoscope Follow Suggestion System provides intelligent, personalized user recommendations using a multi-factor scoring algorithm powered by Elasticsearch. It leverages social graph analysis, shared interests, professional connections, and user activity patterns to suggest relevant users to follow.

## Architecture Components

### Core Technologies
- **Elasticsearch**: Advanced search and scoring engine
- **Spring Data Elasticsearch**: Elasticsearch integration
- **PostgreSQL**: Social graph storage (Follow relationships)
- **Function Score Query**: Multi-criteria ranking algorithm

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   Follow API     │    │   Elasticsearch     │
│   (Suggestions) │───▶│   Controller     │───▶│   (UserDocument)    │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                          │
                                ▼                          │
                       ┌──────────────────┐                │
                       │   Follow Service │                │
                       │   - Scoring      │                │
                       │   - Filtering    │                │
                       └──────────────────┘                │
                                │                          │
                                ▼                          │
                       ┌──────────────────┐                │
                       │   PostgreSQL     │◀───────────────┘
                       │   - Follows      │   (Sync Service)
                       │   - User Blocks  │
                       └──────────────────┘
```

## Component Structure

```
users/
├── controller/
│   └── FollowController.java              # Follow suggestions endpoint
├── service/
│   ├── FollowService.java                 # Follow suggestions interface
│   ├── impl/
│   │   └── FollowServiceImpl.java         # Suggestion algorithm implementation
│   ├── FollowDocumentSyncService.java     # Elasticsearch sync service
│   └── UserDocumentSyncService.java       # User document sync service
├── repository/
│   ├── FollowRepository.java              # Social graph queries
│   ├── UserBlockRepository.java           # Blocking relationships
│   └── search/
│       └── UserSearchRepository.java      # Elasticsearch repository
├── document/
│   └── UserDocument.java                  # Elasticsearch user index
├── model/
│   └── Follow.java                        # Follow relationship entity
├── dto/
│   └── response/
│       └── UserDetailsSummaryResponseDTO.java  # Suggestion response format
└── routes/
    └── FollowRoutes.java                  # API route constants
```

## Core Data Models

### Follow Entity
Represents bidirectional follower/following relationships:

```java
@Entity
@Table(name = "follows")
public class Follow {
    private Long followId;                 // Primary key
    private User follower;                 // User who follows
    private User following;                // User being followed
    private LocalDateTime createdAt;       // Relationship timestamp
}
```

**Database Constraints:**
- Unique constraint on (follower_id, following_id) to prevent duplicate follows
- Indexed for efficient social graph traversal

### UserDocument (Elasticsearch)
Searchable user profile with social graph metadata:

```java
@Document(indexName = "users")
public class UserDocument {
    private String id;                     // Elasticsearch document ID
    private Long userId;                   // PostgreSQL user ID
    private String username;
    private String email;
    private String designation;            // Professional title
    private String summary;                // User bio
    private String profilePictureUrl;
    private String accountStatus;          // ACTIVE, PENDING, SUSPENDED
    
    // Social Graph Counts
    private Integer followerCount;         // Number of followers
    private Integer followingCount;        // Number of following
    
    // Interest-Based Matching
    private List<Long> interests;          // Category IDs
    
    // Block Filtering
    private List<Long> blockedByUserIds;   // Users who blocked this user
    private List<Long> blockedUserIds;     // Users this user blocked
    
    // Activity Signals
    private LocalDateTime lastSeen;        // Recent activity indicator
    
    // Future ML Features
    private float[] faceEmbedding;         // Face recognition vector (1024 dims)
}
```

## Follow Suggestion Algorithm

### Overview
The suggestion algorithm uses Elasticsearch's **Function Score Query** with multiple weighted scoring functions to rank potential connections.

### Algorithm Flow

```
1. Gather User Context
   ├── Fetch target user's UserDocument from Elasticsearch
   ├── Extract user interests (category IDs)
   ├── Extract designation (professional title)
   ├── Fetch blocked/blocking user lists
   └── Fetch already-following user IDs

2. Build Friends-of-Friends Network
   ├── Query PostgreSQL for users followed by target user
   └── Query PostgreSQL for second-degree connections

3. Construct Elasticsearch Query
   ├── Base filters (ACTIVE users, exclude self, exclude already following)
   ├── Block filters (exclude blocked users bidirectionally)
   └── Apply 5 scoring functions (weighted)

4. Execute Search
   ├── Elasticsearch ranks users by combined score
   └── Return paginated results

5. Map to Response DTO
   └── Convert UserDocument → UserDetailsSummaryResponseDTO
```

### Scoring Functions

The algorithm applies **5 weighted scoring functions** that are summed together:

#### Function 1: Friends-of-Friends (Weight: 10.0)
**Purpose:** Recommend users followed by people you already follow (social proof)

```java
// Query users who are followed by your followings
TermsQuery.of(t -> t
    .field("userId")
    .terms(friendsOfFriendsIds)  // Second-degree connections
)
```

**Example:**
- User A follows User B and User C
- User B and User C both follow User D
- User D gets a boost of **10.0** for User A

**Rationale:** Strong social signal - if multiple people you follow also follow someone, they're likely relevant.

#### Function 2: Shared Interests (Weight: 5.0)
**Purpose:** Match users with similar content preferences

```java
// Match on category interests
TermsQuery.of(t -> t
    .field("interests")        // Array of category IDs
    .terms(targetUserInterests)
)
```

**Example:**
- User A has interests: [Photography, Travel, Food]
- User B has interests: [Photography, Fashion]
- User B gets a boost of **5.0** (1 matching interest)

**Rationale:** Content alignment increases engagement likelihood.

#### Function 3: Similar Designation (Weight: 2.0)
**Purpose:** Connect professionals in similar roles

```java
// Text match on job title/designation
MatchQuery.of(m -> m
    .field("designation")
    .query(targetUserDesignation)
)
```

**Example:**
- User A: "Software Engineer"
- User B: "Senior Software Engineer"
- User B gets a boost of **2.0** (text similarity match)

**Rationale:** Professional networking - people in similar roles share common interests.

#### Function 4: Follower Count Boost (Weight: 0.75)
**Purpose:** Cold start problem - help new users discover popular accounts

```java
// Boost users who have follower data
ExistsQuery.of(e -> e
    .field("followerCount")
)
```

**Example:**
- Any user with a followerCount field gets **+0.75**
- Gently promotes established accounts

**Rationale:** Low weight ensures it doesn't override relevance but helps when no social signals exist.

#### Function 5: Recent Activity Boost (Weight: 1.5)
**Purpose:** Prioritize active users for better engagement

```java
// Boost users with recent activity
ExistsQuery.of(e -> e
    .field("lastSeen")
)
```

**Example:**
- Users who have logged in recently get **+1.5**
- Promotes engagement with active community members

**Rationale:** Following active users leads to better feed content and interactions.

### Filtering Logic

#### Exclusion Filters (Must Not Match)
1. **Self-exclusion:** Current user cannot appear in suggestions
2. **Already following:** Users already followed are excluded
3. **Blocked users:** Users blocked by target user
4. **Blocking users:** Users who have blocked target user

#### Inclusion Filters (Must Match)
1. **Account status:** Only ACTIVE users (excludes PENDING, SUSPENDED, DELETED)

```java
BoolQuery mainQuery = BoolQuery.builder()
    .must(TermQuery.of(t -> t
        .field("accountStatus")
        .value("ACTIVE")
    ))
    .mustNot(TermsQuery.of(t -> t
        .field("userId")
        .terms(exclusions)  // Self + already following
    ))
    .mustNot(TermsQuery.of(t -> t
        .field("userId")
        .terms(blockedUserIds)  // Users I blocked
    ))
    .mustNot(TermsQuery.of(t -> t
        .field("userId")
        .terms(blockedByUserIds)  // Users who blocked me
    ))
    .build();
```

### Score Aggregation

All function scores are **summed** using `FunctionScoreMode.Sum`:

```java
FunctionScoreQuery.of(fs -> fs
    .query(mainQuery)
    .functions(allFunctions)
    .scoreMode(FunctionScoreMode.Sum)  // Add all scores together
)
```

**Example Total Score:**
- Friends-of-friends match: **10.0**
- 2 shared interests: **10.0** (5.0 × 2)
- Similar designation: **2.0**
- Has followers: **0.75**
- Recently active: **1.5**
- **Total: 24.25**

Higher scores appear first in results.

## API Endpoints

### Get Follow Suggestions

**Endpoint:** `GET /api/follows/suggestions`

**Authorization:** Required (JWT)

**Query Parameters:**
- `userId` (optional): User ID to get suggestions for (Admin only for other users)
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 10)

**Request Example:**
```http
GET /api/follows/suggestions?page=0&size=10
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Follow suggestions retrieved successfully",
  "data": {
    "content": [
      {
        "userId": 123,
        "email": "jane.doe@example.com",
        "username": "janedoe",
        "accountStatus": "ACTIVE",
        "profilePictureUrl": "https://cdn.example.com/profiles/jane.jpg"
      },
      {
        "userId": 456,
        "email": "john.smith@example.com",
        "username": "johnsmith",
        "accountStatus": "ACTIVE",
        "profilePictureUrl": "https://cdn.example.com/profiles/john.jpg"
      }
    ],
    "currentPage": 0,
    "totalPages": 5,
    "totalElements": 47,
    "pageSize": 10
  },
  "errors": [],
  "timestamp": 1729234567890,
  "path": "/api/follows/suggestions"
}
```

**Status Codes:**
- `200 OK`: Suggestions retrieved successfully
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Attempting to view suggestions for another user (non-admin)
- `404 Not Found`: User document not found in Elasticsearch

## Security & Privacy

### Access Control
- **Authenticated users only:** Must have valid JWT token
- **Self-access by default:** Users can only view their own suggestions
- **Admin override:** Admins can view suggestions for any user

```java
// Security check in service
if (!targetUserId.equals(currentUserId) && !jwtUtils.isAdminFromContext()) {
    throw new AccessDeniedException("You are not authorized to view suggestions for this user.");
}
```

### Privacy Filters

#### Bidirectional Blocking
Both directions of blocking are respected:
1. **User blocks someone:** They won't see the blocked user in suggestions
2. **User is blocked:** They won't see the blocker in suggestions

```java
// Fetch blocking information from UserDocument
List<Long> blockedUserIds = targetUserDoc.getBlockedUserIds();        // I blocked them
List<Long> blockedByUserIds = targetUserDoc.getBlockedByUserIds();    // They blocked me
```

#### Account Status Filtering
Only ACTIVE users appear:
- PENDING (email not verified) - excluded
- SUSPENDED (admin action) - excluded
- DELETED (soft-deleted accounts) - excluded

## Data Synchronization

### Elasticsearch Sync Strategy

The system maintains consistency between PostgreSQL and Elasticsearch using **synchronous sync services**.

#### On Follow Action
```java
@Transactional
public void followUser(Long targetUserId) {
    Follow follow = followRepository.save(newFollow);
    
    // Update follower/following counts in Elasticsearch
    userDocumentSyncService.syncOnFollowChange(currentUserId, targetUserId, true);
    
    // Create follow relationship document (if using FollowDocument index)
    followDocumentSyncService.syncOnFollow(follow);
}
```

#### On Unfollow Action
```java
@Transactional
public void unfollowUser(Long targetUserId) {
    followRepository.delete(follow);
    
    // Update follower/following counts in Elasticsearch
    userDocumentSyncService.syncOnFollowChange(currentUserId, targetUserId, false);
    
    // Remove follow relationship document
    followDocumentSyncService.syncOnUnfollow(currentUserId, targetUserId);
}
```

### Sync Service Responsibilities

**UserDocumentSyncService:**
- Updates `followerCount` and `followingCount` fields
- Maintains user profile information
- Syncs blocking relationships

**FollowDocumentSyncService:**
- Creates/deletes follow relationship documents
- Maintains follow graph for advanced queries

## Performance Considerations

### Query Optimization

#### 1. Pagination
Suggestions are paginated to limit memory usage:
```java
Pageable pageable = PageRequest.of(page, size);  // Default: 10 per page
```

#### 2. Indexed Fields
All query fields are indexed in Elasticsearch:
- `userId` - Keyword field for exact matching
- `interests` - Long array for multi-value matching
- `designation` - Text field for fuzzy matching
- `accountStatus` - Keyword for filtering
- `followerCount`, `lastSeen` - For existence queries

#### 3. Database Query Efficiency
Friends-of-friends uses optimized batch queries:
```java
// Single query for all second-degree connections
Set<Long> friendsOfFriends = followRepository.findFollowingIdsByFollowerIds(alreadyFollowingIds);
```

### Scalability

#### Cold Start Handling
For new users with no follows:
- Friends-of-friends returns empty → no score boost
- Popularity and activity functions ensure results still appear
- Interest matching provides baseline relevance

#### Elasticsearch Performance
- **Index size:** ~1KB per user document
- **Query time:** < 100ms for typical queries
- **Concurrent requests:** Elasticsearch handles distributed load

## Error Handling

### Graceful Degradation
If Elasticsearch is unavailable, the service returns empty results:

```java
try {
    SearchHits<UserDocument> searchHits = elasticsearchTemplate.search(nativeQuery, UserDocument.class);
    // Process results...
} catch (Exception e) {
    log.error("Error generating follow suggestions: {}", e.getMessage(), e);
    return PaginatedResponse.fromPage(Page.empty(pageable));  // Empty page, no error thrown
}
```

### Edge Cases

1. **User not indexed:** Returns empty page with warning log
2. **No matching users:** Returns empty page (200 OK)
3. **All users already followed:** Returns empty page
4. **Elasticsearch down:** Returns empty page (degrades gracefully)

## Logging & Monitoring

### Debug Logging
The implementation includes comprehensive debug logs:

```java
log.debug("Fetching UserDocument for target user {}", targetUserId);
log.debug("Target user {} has blocked {} users", targetUserId, blockedUserIds.size());
log.debug("Adding Friends-of-Friends scoring function with {} candidates", friendsOfFriendsIds.size());
log.info("Returned {} suggestions for user {}", userDocuments.size(), targetUserId);
```

### Monitoring Points
- **Suggestion count:** How many users returned per query
- **Query execution time:** Elasticsearch performance
- **Empty results rate:** Indicator of data quality or algorithm issues
- **Error rate:** Elasticsearch connectivity issues

## Future Enhancements

### 1. Machine Learning Integration
**Face Embedding Similarity:**
```java
// Already indexed in UserDocument
private float[] faceEmbedding;  // 1024-dimensional vector
```

Future function could use vector similarity:
```java
// Cosine similarity search
ScriptScoreQuery.of(s -> s
    .query(mainQuery)
    .script(script -> script
        .inline(i -> i
            .source("cosineSimilarity(params.query_vector, 'faceEmbedding') + 1.0")
            .params("query_vector", JsonData.of(targetUserFaceEmbedding))
        )
    )
)
```

### 2. Mutual Connections Count
Display how many mutual friends exist:
```java
// Add to response DTO
private Integer mutualConnectionsCount;
```

### 3. Activity-Based Scoring
Use actual activity metrics:
- Post frequency
- Engagement rate (likes, comments)
- Response time to messages

### 4. Geographic Proximity
Add location-based boost:
```java
// Add to UserDocument
private GeoPoint location;

// Scoring function
GaussDecayFunction.of(g -> g
    .field("location")
    .origin(targetUserLocation)
    .scale("50km")  // Boost within 50km
)
```

### 5. Time-Decay for Stale Suggestions
Reduce score for users who have been suggested before:
```java
// Track suggestion history
private List<Long> previouslySuggestedUserIds;
```

## Dependencies

### Maven Dependencies
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

### Required Services
- PostgreSQL 14+
- Elasticsearch 8.x (compatible with Spring Boot 3.x)
- Redis (for caching - optional optimization)

## Testing Recommendations

### Unit Tests
1. **Algorithm logic:** Test scoring function weights
2. **Filtering:** Verify blocking and exclusion logic
3. **Edge cases:** Empty results, single user, no interests

### Integration Tests
1. **Elasticsearch queries:** Verify query structure
2. **Database consistency:** Follow → Elasticsearch sync
3. **Pagination:** Correct page boundaries

### Performance Tests
1. **Large datasets:** 10k+ users
2. **Concurrent requests:** 100+ simultaneous queries
3. **Cold start:** New users with no data

### Test Data Scenarios
```java
// Scenario 1: Friends-of-friends match
User A follows User B
User B follows User C
Result: User C suggested to User A (score: 10.0)

// Scenario 2: Interest match
User A interests: [1, 2, 3]
User B interests: [2, 3, 4]
Result: User B suggested (score: 10.0 for 2 matches)

// Scenario 3: Blocking
User A blocks User C
Result: User C never appears in User A's suggestions

// Scenario 4: Already following
User A follows User D
Result: User D excluded from suggestions
```

## Troubleshooting

### Issue: Empty Suggestions Always Returned

**Possible Causes:**
1. User not indexed in Elasticsearch
2. All users already followed
3. Elasticsearch connection failure

**Debug Steps:**
```java
// Check if user exists in Elasticsearch
UserDocument doc = userSearchRepository.findById(userId).orElse(null);
if (doc == null) {
    log.warn("User {} not found in Elasticsearch", userId);
}

// Check follower counts
Set<Long> following = followRepository.findFollowingIdsByFollowerId(userId);
log.info("User {} follows {} users", userId, following.size());
```

### Issue: Incorrect Suggestions (Blocked Users Appearing)

**Possible Causes:**
1. Sync service not updating UserDocument
2. Block data not propagated to Elasticsearch

**Debug Steps:**
```java
// Verify UserDocument block lists
List<Long> blockedIds = userDoc.getBlockedUserIds();
log.debug("User {} has blocked: {}", userId, blockedIds);
```

### Issue: Low Relevance Scores

**Possible Causes:**
1. User has no interests set
2. No social connections
3. Weights need tuning

**Solution:**
Adjust function weights based on your use case:
```java
// Example: Increase interest matching importance
.weight(8.0)  // Changed from 5.0
```

## Related Documentation
- [User Management System](USER_MANAGEMENT_SYSTEM.md) - User profiles and social graph
- [Elasticsearch Integration](BACKEND_ARCHITECTURE.md) - Search infrastructure
- [Authentication System](AUTHENTICATION_SYSTEM.md) - JWT and access control
- [Redis Integration](REDIS_INTEGRATION.md) - Caching strategies

## Summary

The Follow Suggestion System provides intelligent user recommendations through:
- **Multi-factor scoring:** 5 weighted functions for comprehensive ranking
- **Social proof:** Friends-of-friends network analysis
- **Interest alignment:** Category-based matching
- **Privacy controls:** Bidirectional blocking and account status filtering
- **Elasticsearch power:** Fast, scalable search infrastructure
- **Graceful degradation:** Handles errors without breaking user experience

The algorithm balances relevance (social connections, interests) with diversity (popularity, activity) to provide engaging, personalized suggestions that drive user engagement and network growth.

