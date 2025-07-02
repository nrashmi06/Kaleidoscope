# User Block Management API Documentation

## Overview
User blocking system with bidirectional blocking, status checking, and admin management for maintaining a safe community environment in the Kaleidoscope application.

## Created Components

### 1. Routes (UserBlockRoutes.java)
- `BLOCK_USER`: POST `/api/user-blocks/block`
- `UNBLOCK_USER`: DELETE `/api/user-blocks/unblock`
- `GET_BLOCKED_USERS`: GET `/api/user-blocks/blocked`
- `GET_USERS_WHO_BLOCKED_ME`: GET `/api/user-blocks/blocked-by`
- `CHECK_BLOCK_STATUS`: GET `/api/user-blocks/status`
- `GET_ALL_BLOCKS_ADMIN`: GET `/api/user-blocks/admin/all`
- `REMOVE_BLOCK_ADMIN`: DELETE `/api/user-blocks/admin/remove`

### 2. DTOs
- **Request**: `BlockUserRequestDTO`, `UnblockUserRequestDTO`
- **Response**: `UserBlockResponseDTO`, `BlockStatusResponseDTO`, `BlockedUsersListResponseDTO`

### 3. Features
- Simple blocking system with reason tracking
- Bidirectional block status checking
- Paginated blocked user lists
- Admin oversight capabilities
- Unique block constraints

### 4. Model
- `UserBlock` entity with blocker/blocked relationship
- Unique constraint preventing duplicate blocks
- Automatic timestamp tracking with `@PrePersist`

### 5. Security
- Authentication required for all operations
- Admin role (`ROLE_ADMIN`) required for admin operations

## API Endpoints

### 1. Block User

#### Block Another User
```
POST /api/user-blocks/block
Authorization: Bearer token required
Content-Type: application/json

Body:
{
  "userIdToBlock": 456,
  "reason": "Harassment and inappropriate behavior"
}

Response: 200 OK
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "blockId": 123,
    "blocker": {
      "userId": 789,
      "email": "john.doe@example.com",
      "username": "johndoe",
      "accountStatus": "ACTIVE"
    },
    "blocked": {
      "userId": 456,
      "email": "problem.user@example.com",
      "username": "problemuser",
      "accountStatus": "ACTIVE"
    },
    "createdAt": "2025-01-02T16:55:54.487"
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-blocks/block"
}
```

**Request Fields:**
- `userIdToBlock` (required): The ID of the user to block
- `reason` (optional): Reason for blocking the user

**Response Fields:**
- `blockId`: Generated block ID
- `blocker`: User who initiated the block (UserDetailsSummaryResponseDTO)
- `blocked`: User who was blocked (UserDetailsSummaryResponseDTO)
- `createdAt`: Timestamp when block was created

**Features:**
- Creates new block relationship
- Prevents duplicate blocks with unique constraint
- Optional reason tracking for moderation
- Automatic timestamp creation

**Error Scenarios:**
- User not found → 404 NOT_FOUND
- Cannot block yourself → 400 BAD_REQUEST
- User already blocked → handled by unique constraint

### 2. Unblock User

#### Unblock Previously Blocked User
```
DELETE /api/user-blocks/unblock
Authorization: Bearer token required
Content-Type: application/json

Body:
{
  "userIdToUnblock": 456
}

Response: 200 OK
{
  "success": true,
  "message": "User unblocked successfully",
  "data": "User unblocked successfully",
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-blocks/unblock"
}
```

**Request Fields:**
- `userIdToUnblock` (required): The ID of the user to unblock

**Features:**
- Removes existing block relationship
- Returns simple string confirmation
- Safe operation (no error if not blocked)

**Error Scenarios:**
- User not found → 404 NOT_FOUND
- Block not found → handled gracefully

### 3. Get Blocked Users

#### Get List of Users You've Blocked
```
GET /api/user-blocks/blocked?page=0&size=20&sort=createdAt,desc
Authorization: Bearer token required

Query Parameters:
- page (optional): Page number (default: 0)
- size (optional): Page size (default: 20)
- sort (optional): Sort criteria (default: varies)

Response: 200 OK
{
  "success": true,
  "message": "Blocked users retrieved successfully",
  "data": {
    "blockedUsers": [
      {
        "userId": 456,
        "email": "problem.user@example.com",
        "username": "problemuser",
        "accountStatus": "ACTIVE"
      },
      {
        "userId": 789,
        "email": "another.user@example.com",
        "username": "anotheruser",
        "accountStatus": "ACTIVE"
      }
    ],
    "currentPage": 0,
    "totalPages": 1,
    "totalElements": 2
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-blocks/blocked"
}
```

**Response Structure:**
- `blockedUsers`: List of `UserDetailsSummaryResponseDTO` objects
- `currentPage`: Current page number
- `totalPages`: Total number of pages
- `totalElements`: Total number of blocked users

**User Details Include:**
- `userId`: User's unique identifier
- `email`: User's email address
- `username`: User's username
- `accountStatus`: Current account status

### 4. Get Users Who Blocked Me

#### Get List of Users Who Have Blocked You
```
GET /api/user-blocks/blocked-by?page=0&size=20&sort=createdAt,desc
Authorization: Bearer token required

Query Parameters:
- page (optional): Page number (default: 0)
- size (optional): Page size (default: 20)
- sort (optional): Sort criteria (default: varies)

Response: 200 OK
{
  "success": true,
  "message": "Users who blocked you retrieved successfully",
  "data": {
    "blockedUsers": [
      {
        "userId": 123,
        "email": "user1@example.com",
        "username": "user1",
        "accountStatus": "ACTIVE"
      }
    ],
    "currentPage": 0,
    "totalPages": 1,
    "totalElements": 1
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-blocks/blocked-by"
}
```

**Response Structure:**
- Same structure as blocked users endpoint
- Returns users who have blocked the current user
- Includes pagination information

### 5. Check Block Status

#### Check Blocking Relationship Between Users
```
GET /api/user-blocks/status?targetUserId=456
Authorization: Bearer token required

Query Parameters:
- targetUserId (required): User ID to check relationship with

Response: 200 OK
{
  "success": true,
  "message": "Block status retrieved successfully",
  "data": {
    "isBlocked": true,
    "isBlockedBy": false,
    "blockId": 123
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-blocks/status"
}
```

**Response Fields:**
- `isBlocked`: Whether you have blocked the target user
- `isBlockedBy`: Whether the target user has blocked you
- `blockId`: Block ID if blocked, null otherwise

**Features:**
- Bidirectional block checking
- Returns specific block ID for reference
- Quick status verification

### 6. Admin: Get All Blocks

#### Admin Overview of All User Blocks
```
GET /api/user-blocks/admin/all?page=0&size=20&sort=createdAt,desc
Authorization: Bearer token required (ADMIN role)

Query Parameters:
- page, size: Pagination controls
- sort: Sorting criteria

Response: 200 OK
{
  "success": true,
  "message": "All blocks retrieved successfully",
  "data": {
    "content": [
      {
        "blockId": 123,
        "blocker": {
          "userId": 789,
          "email": "john.doe@example.com",
          "username": "johndoe",
          "accountStatus": "ACTIVE"
        },
        "blocked": {
          "userId": 456,
          "email": "problem.user@example.com",
          "username": "problemuser",
          "accountStatus": "ACTIVE"
        },
        "createdAt": "2025-01-02T16:55:54.487"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "sorted": true,
        "orders": [{"property": "createdAt", "direction": "DESC"}]
      }
    },
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true,
    "numberOfElements": 1
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-blocks/admin/all"
}
```

**Features:**
- Admin-only access with `ROLE_ADMIN`
- Complete block information with user details
- Standard Spring Data pagination response
- Comprehensive oversight capabilities

### 7. Admin: Remove Block

#### Admin Force Remove Block
```
DELETE /api/user-blocks/admin/remove?blockId=123
Authorization: Bearer token required (ADMIN role)

Query Parameters:
- blockId (required): The ID of the block to remove

Response: 200 OK
{
  "success": true,
  "message": "Block removed successfully",
  "data": "Block removed successfully",
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-blocks/admin/remove"
}
```

**Features:**
- Admin-only access for forced block removal
- Simple confirmation response
- Direct block ID removal

**Error Scenarios:**
- Block not found → 404 NOT_FOUND
- Admin role required → 403 FORBIDDEN

## Database Model

### UserBlock Entity
```java
@Entity
@Table(name = "user_blocks",
        uniqueConstraints = @UniqueConstraint(columnNames = {"blocker_id", "blocked_id"}))
public class UserBlock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long blockId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_id", nullable = false)
    private User blocked;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
```

**Key Features:**
- Unique constraint on (blocker_id, blocked_id) prevents duplicate blocks
- Lazy loading for performance optimization
- Automatic timestamp creation with `@PrePersist`
- Bidirectional relationship with User entity

## Security & Authorization

### Authentication
- All endpoints require valid JWT token
- Uses `@PreAuthorize("isAuthenticated()")` for standard operations

### Authorization
- Admin endpoints require `ROLE_ADMIN`
- Uses `@PreAuthorize("hasRole('ROLE_ADMIN')")` for admin operations

## Error Handling

### Custom Exceptions
Your application includes specific block-related exceptions:
- `UserAlreadyBlockedException`: When trying to block already blocked user
- `SelfBlockNotAllowedException`: When trying to block yourself
- `UserBlockNotFoundException`: When block relationship doesn't exist

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": ["Specific error details"],
  "timestamp": 1751455561337,
  "path": "/api/user-blocks/endpoint"
}
```

### Status Codes
- **200 OK**: Successful operation
- **400 BAD_REQUEST**: Invalid request data
- **401 UNAUTHORIZED**: Authentication required
- **403 FORBIDDEN**: Admin role required
- **404 NOT_FOUND**: User or block not found

## Bruno API Test Suite

Your existing Bruno API test collection in `Kaleidoscope-api-test/user-blocks/`:

1. **block user.bru** - Block another user
2. **unblock user.bru** - Unblock previously blocked user
3. **get blocked users.bru** - Retrieve blocked users list
4. **get users who blocked me.bru** - View users who blocked you
5. **check block status.bru** - Check bidirectional block status
6. **admin get all blocks.bru** - Admin block overview
7. **admin remove block.bru** - Admin forced block removal

### Test Features:
- Environment variables for base URL and tokens
- Admin role validation
- Bidirectional relationship testing
- Pagination testing

## Service Implementation

### Key Methods
- `blockUser(BlockUserRequestDTO)`: Creates block relationship
- `unblockUser(UnblockUserRequestDTO)`: Removes block relationship
- `getBlockedUsers(Pageable)`: Returns paginated blocked users
- `getUsersWhoBlockedMe(Pageable)`: Returns users who blocked current user
- `checkBlockStatus(Long targetUserId)`: Checks bidirectional block status
- `getAllBlocks(Pageable)`: Admin method for all blocks
- `removeBlock(Long blockId)`: Admin method to remove specific block

### Pagination
- Default page size: 20 items
- Configurable via `@PageableDefault(size = 20)`
- Returns complete pagination metadata

This user block management system provides essential community safety features with proper relationship management, admin oversight, and comprehensive blocking capabilities for the Kaleidoscope application.
