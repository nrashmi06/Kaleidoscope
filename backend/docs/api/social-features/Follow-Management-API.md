# Follow Management API Documentation

## Overview
Social following system with follow/unfollow capabilities, follower/following lists, and relationship management for building connections in the Kaleidoscope application.

**Base URL**: `/api/follows`

## Created Components

### 1. Routes (FollowRoutes.java)
- `FOLLOW`: POST/DELETE `/api/follows`
- `FOLLOWERS`: GET `/api/follows/followers`  
- `FOLLOWING`: GET `/api/follows/following`

### 2. DTOs
- **Response**: `FollowListResponseDTO` (users, currentPage, totalPages, totalElements)
- **User Details**: `UserDetailsSummaryResponseDTO` (userId, email, username, accountStatus, profilePictureUrl)

### 3. Features
- Follow/unfollow users with request parameter approach
- Paginated follower and following lists with default size of 10
- User summary information in follow lists including profile pictures
- Unique follow relationships with database constraints

### 4. Model
- `Follow` entity with follower/following relationship
- Unique constraint preventing duplicate follows
- Automatic timestamp tracking with `@PrePersist`

### 5. Security
- Authentication required for all operations (`@PreAuthorize("isAuthenticated()")`)
- Users can only perform actions on behalf of themselves
- Default page size: 10 items (`@PageableDefault(size = 10)`)

## API Endpoints

### 1. Follow User

#### Follow Another User
```
POST /api/follows?targetUserId=456
Authorization: Bearer <accessToken>
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8080/kaleidoscope/api/follows?targetUserId=456" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Successfully followed user",
  "data": "Followed user 456",
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/follows"
}
```

**Request Parameters:**
- `targetUserId` (required): The ID of the user to follow

**Features:**
- Creates new follow relationship
- Prevents duplicate follows with unique constraint
- Automatic timestamp tracking

**Error Scenarios:**
- User not found → 404 NOT_FOUND
- Already following user → handled by unique constraint
- Cannot follow yourself → prevented by business logic

### 2. Unfollow User

#### Unfollow Previously Followed User
```
DELETE /api/follows?targetUserId=456
Authorization: Bearer <accessToken>
```

**cURL Example**:
```bash
curl -X DELETE "http://localhost:8080/kaleidoscope/api/follows?targetUserId=456" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Successfully unfollowed user",
  "data": "Unfollowed user 456",
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/follows"
}
```

**Request Parameters:**
- `targetUserId` (required): The ID of the user to unfollow

**Features:**
- Removes existing follow relationship
- Safe operation (no error if not following)

**Error Scenarios:**
- User not found → 404 NOT_FOUND
- Follow relationship not found → handled gracefully

### 3. Get Followers

#### Get List of User's Followers (Paginated)
```
GET /api/follows/followers?userId=456&page=0&size=10&sort=createdAt,desc
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `userId` (required): User ID to get followers for
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 10)
- `sort` (optional): Sort criteria (default: varies)

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/follows/followers?userId=456&page=0&size=10" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Followers retrieved successfully",
  "data": {
    "users": [
      {
        "userId": 789,
        "email": "jane.doe@example.com",
        "username": "janedoe",
        "accountStatus": "ACTIVE",
        "profilePictureUrl": "https://your-cdn.com/profiles/jane-profile.jpg"
      },
      {
        "userId": 890,
        "email": "mike.smith@example.com",
        "username": "mikesmith",
        "accountStatus": "ACTIVE",
        "profilePictureUrl": "https://your-cdn.com/profiles/mike-profile.jpg"
      }
    ],
    "currentPage": 0,
    "totalPages": 3,
    "totalElements": 25
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/follows/followers"
}
```

**Response Structure** (`FollowListResponseDTO`):
- `users`: List of `UserDetailsSummaryResponseDTO` objects
- `currentPage`: Current page number
- `totalPages`: Total number of pages
- `totalElements`: Total number of followers

**User Details Include** (`UserDetailsSummaryResponseDTO`):
- `userId`: User's unique identifier
- `email`: User's email address
- `username`: User's username
- `accountStatus`: Current account status
- `profilePictureUrl`: User's profile picture URL

### 4. Get Following

#### Get List of Users Someone is Following (Paginated)
```
GET /api/follows/following?userId=456&page=0&size=10&sort=createdAt,desc
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `userId` (required): User ID to get following list for
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 10)
- `sort` (optional): Sort criteria (default: varies)

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/follows/following?userId=456&page=0&size=10" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Following list retrieved successfully",
  "data": {
    "users": [
      {
        "userId": 123,
        "email": "john.doe@example.com",
        "username": "johndoe",
        "accountStatus": "ACTIVE",
        "profilePictureUrl": "https://your-cdn.com/profiles/john-profile.jpg"
      },
      {
        "userId": 234,
        "email": "alice.wilson@example.com",
        "username": "alicewilson",
        "accountStatus": "ACTIVE",
        "profilePictureUrl": "https://your-cdn.com/profiles/alice-profile.jpg"
      }
    ],
    "currentPage": 0,
    "totalPages": 2,
    "totalElements": 15
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/follows/following"
}
```

**Response Structure:**
- Same structure as followers endpoint (`FollowListResponseDTO`)
- Returns users that the specified user is following
- Includes pagination information for large lists

## Database Model

### Follow Entity
```java
@Entity
@Table(name = "follows",
        uniqueConstraints = @UniqueConstraint(columnNames = {"follower_id", "following_id"}))
public class Follow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long followId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    private User following;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
```

**Key Features:**
- Unique constraint on (follower_id, following_id) prevents duplicate follows
- Lazy loading for performance optimization
- Automatic timestamp creation with `@PrePersist`
- Bidirectional relationship with User entity

## Security & Authorization

### Authentication
- All endpoints require valid JWT token
- Uses `@PreAuthorize("isAuthenticated()")` for all operations

### Pagination
- Default page size: 10 items (`@PageableDefault(size = 10)`)
- Configurable page size via request parameters
- Returns complete pagination metadata

### Business Logic
- Users cannot follow themselves (handled in service layer)
- Follow relationships are unique per user pair
- Pagination prevents large data exposure

## Error Response Format
All endpoints return standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": ["Specific error details"],
  "timestamp": 1751455561337,
  "path": "/api/follows/{endpoint}"
}
```

### Status Codes
- **200 OK**: Successful operation
- **400 BAD_REQUEST**: Invalid request parameters
- **401 UNAUTHORIZED**: Authentication required
- **404 NOT_FOUND**: User not found

## Service Implementation

### Key Methods (FollowService)
- `followUser(Long targetUserId)`: Creates follow relationship
- `unfollowUser(Long targetUserId)`: Removes follow relationship
- `getFollowers(Long userId, Pageable pageable)`: Returns paginated followers
- `getFollowing(Long userId, Pageable pageable)`: Returns paginated following list

### Controller Implementation (FollowController)
- Implements `FollowApi` interface for Swagger documentation
- Uses `@RequestParam` for targetUserId and userId parameters
- Returns standardized `ApiResponse<T>` wrapper
- Includes proper timestamp and path information

## Bruno API Test Suite
Located under `Kaleidoscope-api-test/users/` or similar:
- Follow user functionality testing
- Unfollow user functionality testing
- Get followers with pagination testing
- Get following with pagination testing

## Features Implemented
✅ Follow/unfollow users with request parameters  
✅ Paginated follower and following lists  
✅ User summary information with profile pictures  
✅ Unique follow relationships with database constraints  
✅ Authentication required for all operations  
✅ Standardized API response format  
✅ Default pagination (10 items per page)  
✅ Swagger documentation via FollowApi interface  
✅ Context path support (/kaleidoscope)

This follow management system provides essential social networking capabilities with proper relationship management, pagination, and security controls for the Kaleidoscope application.
