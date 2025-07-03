# User Notification Preferences API Documentation

## Overview
Notification management system with granular controls for different notification types and delivery methods for the Kaleidoscope application.

## Created Components

### 1. Routes (UserNotificationPreferencesRoutes.java)
- `GET_NOTIFICATION_PREFERENCES`: GET `/api/user-notification-preferences`
- `UPDATE_NOTIFICATION_PREFERENCES`: PUT `/api/user-notification-preferences`
- `UPDATE_LIKES_PREFERENCES`: PATCH `/api/user-notification-preferences/likes`
- `UPDATE_COMMENTS_PREFERENCES`: PATCH `/api/user-notification-preferences/comments`
- `UPDATE_FOLLOWS_PREFERENCES`: PATCH `/api/user-notification-preferences/follows`
- `UPDATE_MENTIONS_PREFERENCES`: PATCH `/api/user-notification-preferences/mentions`
- `UPDATE_SYSTEM_PREFERENCES`: PATCH `/api/user-notification-preferences/system`
- `UPDATE_EMAIL_PREFERENCES`: PATCH `/api/user-notification-preferences/email`
- `UPDATE_PUSH_PREFERENCES`: PATCH `/api/user-notification-preferences/push`
- `ENABLE_ALL_EMAIL`: POST `/api/user-notification-preferences/email/enable-all`
- `DISABLE_ALL_EMAIL`: POST `/api/user-notification-preferences/email/disable-all`
- `ENABLE_ALL_PUSH`: POST `/api/user-notification-preferences/push/enable-all`
- `DISABLE_ALL_PUSH`: POST `/api/user-notification-preferences/push/disable-all`
- `RESET_TO_DEFAULTS`: POST `/api/user-notification-preferences/reset`

### 2. DTOs
- **Request**: `UpdateNotificationPreferencesRequestDTO`, `UpdateLikesPreferencesRequestDTO`, `UpdateCommentsPreferencesRequestDTO`, `UpdateFollowsPreferencesRequestDTO`, `UpdateMentionsPreferencesRequestDTO`, `UpdateSystemPreferencesRequestDTO`, `UpdateEmailPreferencesRequestDTO`, `UpdatePushPreferencesRequestDTO`
- **Response**: `UserNotificationPreferencesResponseDTO`

### 3. Features
- Simple notification preference management for 5 categories (likes, comments, follows, mentions, system)
- Dual delivery method support (email and push)
- Individual category updates via PATCH operations
- Bulk operations for email/push enable/disable
- Reset to defaults functionality
- Admin overview capabilities

### 4. Model
- `UserNotificationPreferences` entity with one-to-one relationship to User
- Boolean fields for each notification type and delivery method
- Default values set to `true` for all preferences

### 5. Security
- Authentication required for all operations
- Admin role required for admin overview functionality

## API Endpoints

### 1. Get Notification Preferences

#### Get Current User Notification Preferences
```
GET /api/user-notification-preferences
Authorization: Bearer token required

Response: 200 OK
{
  "success": true,
  "message": "Notification preferences retrieved successfully",
  "data": {
    "preferenceId": 123,
    "userId": 456,
    "likesEmail": true,
    "likesPush": true,
    "commentsEmail": true,
    "commentsPush": true,
    "followsEmail": true,
    "followsPush": true,
    "mentionsEmail": true,
    "mentionsPush": true,
    "systemEmail": true,
    "systemPush": false,
    "createdAt": "2025-01-02T16:55:54.487",
    "updatedAt": "2025-01-02T16:55:54.487"
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences"
}
```

#### Get Specific User Notification Preferences (Admin)
```
GET /api/user-notification-preferences/{userId}
Authorization: Bearer token required

Response: 200 OK
{
  "success": true,
  "message": "Notification preferences retrieved successfully",
  "data": {
    "preferenceId": 124,
    "userId": 789,
    "likesEmail": false,
    "likesPush": true,
    "commentsEmail": true,
    "commentsPush": true,
    "followsEmail": false,
    "followsPush": true,
    "mentionsEmail": true,
    "mentionsPush": true,
    "systemEmail": true,
    "systemPush": false,
    "createdAt": "2025-01-01T10:30:00.000",
    "updatedAt": "2025-01-02T14:20:15.789"
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/789"
}
```

**Response Structure:**
- `preferenceId`: Unique preference record ID
- `userId`: User ID these preferences belong to
- Boolean fields for each notification type and delivery method
- `createdAt`/`updatedAt`: Timestamp tracking

### 2. Admin: Get All Notification Preferences

#### Admin Overview of All User Notification Preferences
```
GET /api/user-notification-preferences/admin/all?page=0&size=20&sort=updatedAt,desc
Authorization: Bearer token required (ADMIN role)

Query Parameters:
- page, size: Pagination controls
- sort: Sorting criteria

Response: 200 OK
{
  "success": true,
  "message": "All notification preferences retrieved successfully",
  "data": {
    "content": [
      {
        "preferenceId": 123,
        "userId": 456,
        "likesEmail": true,
        "likesPush": true,
        "commentsEmail": true,
        "commentsPush": true,
        "followsEmail": true,
        "followsPush": true,
        "mentionsEmail": true,
        "mentionsPush": true,
        "systemEmail": true,
        "systemPush": false,
        "createdAt": "2025-01-02T16:55:54.487",
        "updatedAt": "2025-01-02T16:55:54.487"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "sorted": true,
        "orders": [{"property": "updatedAt", "direction": "DESC"}]
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
  "path": "/api/user-notification-preferences/admin/all"
}
```

### 3. Update All Notification Preferences

#### Update Multiple Notification Categories
```
PUT /api/user-notification-preferences
Authorization: Bearer token required
Content-Type: application/json

Body:
{
  "likesEmail": false,
  "likesPush": true,
  "commentsEmail": true,
  "commentsPush": true,
  "followsEmail": false,
  "followsPush": true,
  "mentionsEmail": true,
  "mentionsPush": true,
  "systemEmail": true,
  "systemPush": false
}

Response: 200 OK
{
  "success": true,
  "message": "Notification preferences updated successfully",
  "data": {
    "preferenceId": 123,
    "userId": 456,
    "likesEmail": false,
    "likesPush": true,
    "commentsEmail": true,
    "commentsPush": true,
    "followsEmail": false,
    "followsPush": true,
    "mentionsEmail": true,
    "mentionsPush": true,
    "systemEmail": true,
    "systemPush": false,
    "createdAt": "2025-01-02T16:55:54.487",
    "updatedAt": "2025-01-02T17:25:30.890"
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences"
}
```

**Request Fields (all required with @NotNull validation):**
- `likesEmail`: Email notifications for likes
- `likesPush`: Push notifications for likes
- `commentsEmail`: Email notifications for comments
- `commentsPush`: Push notifications for comments
- `followsEmail`: Email notifications for follows
- `followsPush`: Push notifications for follows
- `mentionsEmail`: Email notifications for mentions
- `mentionsPush`: Push notifications for mentions
- `systemEmail`: Email notifications for system messages
- `systemPush`: Push notifications for system messages

### 4. Update Likes Notification Preferences

#### Update Like Notification Settings
```
PATCH /api/user-notification-preferences/likes
Authorization: Bearer token required
Content-Type: application/json

Body:
{
  "likesEmail": false,
  "likesPush": true
}

Response: 200 OK
{
  "success": true,
  "message": "Likes notification preferences updated successfully",
  "data": {
    "preferenceId": 123,
    "userId": 456,
    "likesEmail": false,
    "likesPush": true,
    "commentsEmail": true,
    "commentsPush": true,
    "followsEmail": true,
    "followsPush": true,
    "mentionsEmail": true,
    "mentionsPush": true,
    "systemEmail": true,
    "systemPush": false,
    "createdAt": "2025-01-02T16:55:54.487",
    "updatedAt": "2025-01-02T17:30:15.456"
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/likes"
}
```

### 5. Update Comments Notification Preferences

#### Update Comment Notification Settings
```
PATCH /api/user-notification-preferences/comments
Authorization: Bearer token required
Content-Type: application/json

Body:
{
  "commentsEmail": true,
  "commentsPush": true
}

Response: 200 OK
{
  "success": true,
  "message": "Comments notification preferences updated successfully",
  "data": {
    // ... complete UserNotificationPreferencesResponseDTO
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/comments"
}
```

### 6. Update Follows Notification Preferences

#### Update Follow Notification Settings
```
PATCH /api/user-notification-preferences/follows
Authorization: Bearer token required
Content-Type: application/json

Body:
{
  "followsEmail": false,
  "followsPush": true
}

Response: 200 OK
{
  "success": true,
  "message": "Follows notification preferences updated successfully",
  "data": {
    // ... complete UserNotificationPreferencesResponseDTO
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/follows"
}
```

### 7. Update Mentions Notification Preferences

#### Update Mention Notification Settings
```
PATCH /api/user-notification-preferences/mentions
Authorization: Bearer token required
Content-Type: application/json

Body:
{
  "mentionsEmail": true,
  "mentionsPush": true
}

Response: 200 OK
{
  "success": true,
  "message": "Mentions notification preferences updated successfully",
  "data": {
    // ... complete UserNotificationPreferencesResponseDTO
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/mentions"
}
```

### 8. Update System Notification Preferences

#### Update System Notification Settings
```
PATCH /api/user-notification-preferences/system
Authorization: Bearer token required
Content-Type: application/json

Body:
{
  "systemEmail": true,
  "systemPush": false
}

Response: 200 OK
{
  "success": true,
  "message": "System notification preferences updated successfully",
  "data": {
    // ... complete UserNotificationPreferencesResponseDTO
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/system"
}
```

### 9. Bulk Email Control

#### Enable All Email Notifications
```
POST /api/user-notification-preferences/email/enable-all
Authorization: Bearer token required

Response: 200 OK
{
  "success": true,
  "message": "All email notifications enabled successfully",
  "data": {
    "preferenceId": 123,
    "userId": 456,
    "likesEmail": true,
    "likesPush": true,
    "commentsEmail": true,
    "commentsPush": true,
    "followsEmail": true,
    "followsPush": true,
    "mentionsEmail": true,
    "mentionsPush": true,
    "systemEmail": true,
    "systemPush": false,
    "createdAt": "2025-01-02T16:55:54.487",
    "updatedAt": "2025-01-02T18:20:55.012"
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/email/enable-all"
}
```

#### Disable All Email Notifications
```
POST /api/user-notification-preferences/email/disable-all
Authorization: Bearer token required

Response: 200 OK
{
  "success": true,
  "message": "All email notifications disabled successfully",
  "data": {
    // ... UserNotificationPreferencesResponseDTO with all email fields set to false
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/email/disable-all"
}
```

### 10. Bulk Push Control

#### Enable All Push Notifications
```
POST /api/user-notification-preferences/push/enable-all
Authorization: Bearer token required

Response: 200 OK
{
  "success": true,
  "message": "All push notifications enabled successfully",
  "data": {
    // ... UserNotificationPreferencesResponseDTO with all push fields set to true
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/push/enable-all"
}
```

#### Disable All Push Notifications
```
POST /api/user-notification-preferences/push/disable-all
Authorization: Bearer token required

Response: 200 OK
{
  "success": true,
  "message": "All push notifications disabled successfully",
  "data": {
    // ... UserNotificationPreferencesResponseDTO with all push fields set to false
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/push/disable-all"
}
```

### 11. Reset to Defaults

#### Reset All Notification Preferences to Default
```
POST /api/user-notification-preferences/reset
Authorization: Bearer token required

Response: 200 OK
{
  "success": true,
  "message": "Notification preferences reset to defaults successfully",
  "data": {
    "preferenceId": 123,
    "userId": 456,
    "likesEmail": true,
    "likesPush": true,
    "commentsEmail": true,
    "commentsPush": true,
    "followsEmail": true,
    "followsPush": true,
    "mentionsEmail": true,
    "mentionsPush": true,
    "systemEmail": true,
    "systemPush": true,
    "createdAt": "2025-01-02T16:55:54.487",
    "updatedAt": "2025-01-02T18:40:55.234"
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/reset"
}
```

## Database Model

### UserNotificationPreferences Entity
```java
@Entity
@Table(name = "user_notification_preferences")
public class UserNotificationPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long preferenceId;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(name = "likes_email")
    private Boolean likesEmail = true;
    
    @Column(name = "likes_push")
    private Boolean likesPush = true;
    
    @Column(name = "comments_email")
    private Boolean commentsEmail = true;
    
    @Column(name = "comments_push")
    private Boolean commentsPush = true;
    
    @Column(name = "follows_email")
    private Boolean followsEmail = true;
    
    @Column(name = "follows_push")
    private Boolean followsPush = true;
    
    @Column(name = "mentions_email")
    private Boolean mentionsEmail = true;
    
    @Column(name = "mentions_push")
    private Boolean mentionsPush = true;
    
    @Column(name = "system_email")
    private Boolean systemEmail = true;
    
    @Column(name = "system_push")
    private Boolean systemPush = true;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

**Key Features:**
- One-to-one relationship with User entity
- Boolean fields for each notification type and delivery method
- All preferences default to `true`
- Automatic timestamp tracking with `@PrePersist` and `@PreUpdate`

## Notification Categories

### 5 Main Categories
1. **Likes**: Notifications when someone likes your content
2. **Comments**: Notifications when someone comments on your content
3. **Follows**: Notifications when someone follows you
4. **Mentions**: Notifications when someone mentions you
5. **System**: System-level notifications and alerts

### 2 Delivery Methods
- **Email**: Email notifications
- **Push**: Push notifications

## Security & Authorization

### Authentication
- All endpoints require valid JWT token
- Uses `@PreAuthorize("isAuthenticated()")` for all operations

### Authorization
- Admin endpoints require `ROLE_ADMIN`
- Users can only modify their own preferences
- Admins can view all user preferences

## Error Handling

### Custom Exceptions
Your application includes specific notification preference exceptions:
- `UserNotificationPreferencesNotFoundException`: When preferences not found
- `NotificationPreferencesUpdateException`: When update operations fail

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": ["Specific error details"],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/endpoint"
}
```

### Status Codes
- **200 OK**: Successful operation
- **400 BAD_REQUEST**: Invalid input data
- **401 UNAUTHORIZED**: Authentication required
- **403 FORBIDDEN**: Admin role required
- **404 NOT_FOUND**: Preferences not found

## Bruno API Test Suite

Your existing Bruno API test collection in `Kaleidoscope-api-test/user-notification-preferences/`:

Tests for all 14 endpoints including individual category updates, bulk operations, and admin functionality.

## Service Implementation

### Key Methods
- `getNotificationPreferences()`: Get current user's preferences
- `getNotificationPreferencesByUserId(Long userId)`: Get specific user's preferences
- `updateNotificationPreferences(UpdateNotificationPreferencesRequestDTO)`: Update all preferences
- Individual category update methods for likes, comments, follows, mentions, system
- Bulk enable/disable methods for email and push
- `resetToDefaults()`: Reset to default values

This notification preferences system provides essential notification control with simple Boolean toggles for each notification type and delivery method in the Kaleidoscope application.
