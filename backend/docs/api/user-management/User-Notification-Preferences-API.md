# User Notification Preferences API Documentation

## Overview
Notification management system with granular controls for different notification types and delivery methods for the Kaleidoscope application.

**Base URL**: `/api/user-notification-preferences`

## Created Components

### 1. Routes (UserNotificationPreferencesRoutes.java)
- `GET_NOTIFICATION_PREFERENCES`: GET `/api/user-notification-preferences` (and `/{userId}`)
- `GET_ALL_NOTIFICATION_PREFERENCES`: GET `/api/user-notification-preferences/admin/all`
- `UPDATE_NOTIFICATION_PREFERENCES`: PUT `/api/user-notification-preferences`
- `PARTIAL_UPDATE_NOTIFICATION_PREFERENCES`: PATCH `/api/user-notification-preferences`
- `RESET_TO_DEFAULTS`: POST `/api/user-notification-preferences/reset`

### 2. DTOs
- **Request**: `UpdateNotificationPreferencesRequestDTO` (all 10 notification fields with @NotNull validation), `PartialUpdateNotificationPreferencesRequestDTO` (all 10 fields optional)
- **Response**: `UserNotificationPreferencesResponseDTO` (preferenceId, userId, all notification fields, timestamps)

### 3. Features
- Complete notification preference management for 5 categories (likes, comments, follows, mentions, system)
- Dual delivery method support (email and push) for each category
- Full update via PUT operation (all fields required)
- Partial update via PATCH operation (only specified fields updated)
- Reset to defaults functionality
- Admin overview capabilities with pagination
- Current user and specific user ID support

### 4. Model
- `UserNotificationPreferences` entity with one-to-one relationship to User
- Boolean fields for each notification type and delivery method (10 total fields)
- Default values set to `true` for all preferences

### 5. Security
- Authentication required for all operations (`@PreAuthorize("isAuthenticated()")`)
- Admin role required for admin overview functionality (`@PreAuthorize("hasRole('ADMIN')")`)
- Users can only access their own preferences unless admin

## API Endpoints

### 1. Get Notification Preferences

#### Get Current User Notification Preferences
```
GET /api/user-notification-preferences
Authorization: Bearer <accessToken>
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/user-notification-preferences" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
```json
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
Authorization: Bearer <accessToken>
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/user-notification-preferences/789" \
  -H "Authorization: Bearer your-admin-jwt-token"
```

**Response**: `200 OK`
```json
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

**Response Structure** (`UserNotificationPreferencesResponseDTO`):
- `preferenceId`: Unique preference record ID
- `userId`: User ID these preferences belong to
- **Notification Fields** (Boolean values for each):
  - `likesEmail`/`likesPush`: Like notifications
  - `commentsEmail`/`commentsPush`: Comment notifications
  - `followsEmail`/`followsPush`: Follow notifications
  - `mentionsEmail`/`mentionsPush`: Mention notifications
  - `systemEmail`/`systemPush`: System notifications
- `createdAt`/`updatedAt`: Timestamp tracking

### 2. Admin: Get All Notification Preferences

#### Admin Overview of All User Notification Preferences (Paginated)
```
GET /api/user-notification-preferences/admin/all?page=0&size=20&sort=updatedAt,desc
Authorization: Bearer <accessToken>
Role Required: ADMIN
```

**Query Parameters:**
- `page`, `size`: Pagination controls (default varies)
- `sort`: Sorting criteria

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/user-notification-preferences/admin/all?page=0&size=20" \
  -H "Authorization: Bearer your-admin-jwt-token"
```

**Response**: `200 OK`
```json
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
        "unsorted": false,
        "empty": false
      },
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalElements": 1,
    "totalPages": 1,
    "last": true,
    "first": true,
    "size": 20,
    "numberOfElements": 1,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "number": 0,
    "empty": false
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/admin/all"
}
```

**Features:**
- Admin-only access with `@PreAuthorize("hasRole('ADMIN')")`
- Returns Spring Data `Page<UserNotificationPreferencesResponseDTO>`
- Complete notification preferences for all users
- Standard Spring Data pagination response

### 3. Update All Notification Preferences (Full Update)

#### Update Multiple Notification Categories
```
PUT /api/user-notification-preferences
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (`UpdateNotificationPreferencesRequestDTO`):
```json
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
```

**cURL Example**:
```bash
curl -X PUT "http://localhost:8080/kaleidoscope/api/user-notification-preferences" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Response**: `200 OK`
```json
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

**Request Fields** (`UpdateNotificationPreferencesRequestDTO` - **All Required with @NotNull validation**):
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

### 4. Partial Update Notification Preferences

#### Update Specific Notification Settings
```
PATCH /api/user-notification-preferences
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (`PartialUpdateNotificationPreferencesRequestDTO`):
```json
{
  "likesEmail": false,
  "likesPush": true,
  "systemPush": false
}
```

**cURL Example**:
```bash
curl -X PATCH "http://localhost:8080/kaleidoscope/api/user-notification-preferences" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "likesEmail": false,
    "likesPush": true,
    "systemPush": false
  }'
```

**Response**: `200 OK`
```json
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
  "path": "/api/user-notification-preferences"
}
```

**Request Fields** (`PartialUpdateNotificationPreferencesRequestDTO` - **All Optional**):
- Any combination of the 10 notification preference fields
- Only specified fields will be updated
- Unspecified fields remain unchanged
- Same field names as the full update DTO

**Features:**
- Allows updating only specific notification preferences
- Unspecified fields are not modified
- More efficient for targeted preference changes
- Same response structure as full update

### 5. Reset to Defaults

#### Reset All Notification Preferences to Default Values
```
POST /api/user-notification-preferences/reset
Authorization: Bearer <accessToken>
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8080/kaleidoscope/api/user-notification-preferences/reset" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
```json
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

**Features:**
- Resets all notification preferences to default values (typically `true`)
- No request body required
- Updates `updatedAt` timestamp
- Returns complete updated preferences

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
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    // Likes notifications
    @Column(name = "likes_email", nullable = false)
    private Boolean likesEmail = true;
    
    @Column(name = "likes_push", nullable = false)
    private Boolean likesPush = true;
    
    // Comments notifications
    @Column(name = "comments_email", nullable = false)
    private Boolean commentsEmail = true;
    
    @Column(name = "comments_push", nullable = false)
    private Boolean commentsPush = true;
    
    // Follows notifications
    @Column(name = "follows_email", nullable = false)
    private Boolean followsEmail = true;
    
    @Column(name = "follows_push", nullable = false)
    private Boolean followsPush = true;
    
    // Mentions notifications
    @Column(name = "mentions_email", nullable = false)
    private Boolean mentionsEmail = true;
    
    @Column(name = "mentions_push", nullable = false)
    private Boolean mentionsPush = true;
    
    // System notifications
    @Column(name = "system_email", nullable = false)
    private Boolean systemEmail = true;
    
    @Column(name = "system_push", nullable = false)
    private Boolean systemPush = true;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

**Key Features:**
- One-to-one relationship with User entity
- 10 Boolean fields for notification preferences (5 categories × 2 delivery methods each)
- Default values set to `true` for all preferences
- Automatic timestamp tracking with `@PrePersist` and `@PreUpdate`

## Security & Authorization

### Authentication
- All endpoints require valid JWT token
- Uses `@PreAuthorize("isAuthenticated()")` for user operations

### Authorization
- Admin overview requires `ROLE_ADMIN`
- Uses `@PreAuthorize("hasRole('ADMIN')")` for admin endpoint
- Users can only access their own preferences unless admin

### Validation
- Full update requires all fields with `@NotNull` validation
- Partial update allows optional fields
- All fields must be Boolean values

## Error Response Format
All endpoints return standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": ["Specific error details"],
  "timestamp": 1751455561337,
  "path": "/api/user-notification-preferences/{endpoint}"
}
```

### Status Codes
- **200 OK**: Successful operation
- **400 BAD_REQUEST**: Invalid input data or validation errors
- **401 UNAUTHORIZED**: Authentication required
- **403 FORBIDDEN**: Admin role required
- **404 NOT_FOUND**: User preferences not found

## Service Implementation

### Key Methods (UserNotificationPreferencesService)
- `getNotificationPreferences()`: Get current user's preferences
- `getNotificationPreferencesByUserId(Long userId)`: Get specific user's preferences
- `getAllNotificationPreferences(Pageable)`: Admin method for all preferences
- `updateNotificationPreferences(UpdateNotificationPreferencesRequestDTO)`: Full update
- `partialUpdateNotificationPreferences(PartialUpdateNotificationPreferencesRequestDTO)`: Partial update
- `resetToDefaults()`: Reset to default values

### Controller Implementation (UserNotificationPreferencesController)
- Implements `UserNotificationPreferencesApi` interface for Swagger documentation
- Supports both current user and admin access patterns
- Uses `@Valid` for request validation
- Returns standardized `ApiResponse<T>` wrapper
- Handles optional path variable for userId in GET endpoint

## Bruno API Test Suite
Located under `Kaleidoscope-api-test/user-notification-preferences/`:
- Get current user preferences
- Get specific user preferences (admin)
- Get all preferences (admin)
- Full update preferences
- Partial update preferences  
- Reset to defaults

## Features Implemented
✅ Complete notification preference management (5 categories, 2 delivery methods each)  
✅ Full update with required field validation  
✅ Partial update for targeted preference changes  
✅ Reset to defaults functionality  
✅ Admin overview with pagination  
✅ Current user and specific user ID support  
✅ Proper validation with @NotNull constraints  
✅ Swagger documentation via UserNotificationPreferencesApi interface  
✅ Context path support (/kaleidoscope)

This notification preferences system provides comprehensive control over user notifications with flexible update mechanisms and proper admin oversight for the Kaleidoscope application.
