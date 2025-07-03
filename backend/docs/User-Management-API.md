# User Management API Documentation

## Overview
User profile management system with admin capabilities, profile updates, and status management for the Kaleidoscope application.

## Created Components

### 1. Routes (UserRoutes.java)
- `UPDATE_USER_PROFILE`: PUT `/api/users/profile`
- `GET_ALL_USERS_BY_PROFILE_STATUS`: GET `/api/users`
- `UPDATE_USER_PROFILE_STATUS`: PUT `/api/users/profile-status`

### 2. DTOs
- **Request**: `UpdateUserProfileRequestDTO`, `UpdateUserProfileStatusRequestDTO`
- **Response**: `UpdateUserProfileResponseDTO`, `UserDetailsSummaryResponseDTO`

### 3. Features
- Multipart form data support for profile and cover photo uploads
- Admin user management with filtering and search
- Profile status management (ACTIVE, SUSPENDED, DEACTIVATED)
- User profile updates with image handling

### 4. Model
- `User` entity with comprehensive user information
- `AccountStatus` enum for user status management
- `Role` enum for user permissions (USER, MODERATOR, ADMIN)

### 5. Security
- Authentication required for profile updates
- Admin role (`ROLE_ADMIN`) required for user management operations

## API Endpoints

### 1. Update User Profile

#### Update Authenticated User Profile
```
PUT /api/users/profile
Authorization: Bearer token required
Content-Type: multipart/form-data

Body (Form Data):
- profilePicture: File (optional) - New profile picture
- coverPhoto: File (optional) - New cover photo
- userData: JSON - Profile data to update

userData JSON structure:
{
  "username": "johndoe_updated",
  "designation": "Senior Software Developer",
  "summary": "Updated bio - Senior Software Developer with 10+ years experience"
}

Response: 200 OK
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": 123,
    "email": "john.doe@example.com",
    "username": "johndoe_updated",
    "designation": "Senior Software Developer",
    "summary": "Updated bio - Senior Software Developer with 10+ years experience",
    "profilePictureUrl": "https://example.com/profiles/johndoe_updated.jpg",
    "coverPhotoUrl": "https://example.com/covers/johndoe_cover.jpg"
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/users/profile"
}
```

**Request Fields:**
- `username` (optional): New username
- `designation` (optional): User's job title or designation
- `summary` (optional): User's bio/summary description
- `profilePicture` (optional): Profile picture file upload
- `coverPhoto` (optional): Cover photo file upload

**Response Fields:**
- `userId`: User's unique identifier
- `email`: User's email address (not updatable)
- `username`: Updated username
- `designation`: Updated designation
- `summary`: Updated summary/bio
- `profilePictureUrl`: URL of uploaded profile picture
- `coverPhotoUrl`: URL of uploaded cover photo

**Features:**
- Multipart form data support for image uploads
- Updates current authenticated user's profile
- Username uniqueness validation
- Image processing and URL generation

**Error Scenarios:**
- Username already taken → 409 CONFLICT
- Invalid image format → 400 BAD_REQUEST
- File size too large → 413 PAYLOAD_TOO_LARGE
- Unauthorized access → 401 UNAUTHORIZED

### 2. Admin: Get All Users

#### Get Users by Profile Status and Search (Admin Only)
```
GET /api/users?status=ACTIVE&search=john&page=0&size=10&sort=createdAt,desc
Authorization: Bearer token required (ADMIN role)

Query Parameters:
- status (optional): Filter by account status (ACTIVE, SUSPENDED, DEACTIVATED)
- search (optional): Search by username or email
- page (optional): Page number (default: 0)
- size (optional): Page size (default: varies)
- sort (optional): Sort criteria (default: varies)

Response: 200 OK
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "content": [
      {
        "userId": 123,
        "email": "john.doe@example.com",
        "username": "johndoe",
        "accountStatus": "ACTIVE"
      },
      {
        "userId": 124,
        "email": "jane.smith@example.com",
        "username": "janesmith",
        "accountStatus": "ACTIVE"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": {
        "sorted": true,
        "orders": [{"property": "createdAt", "direction": "DESC"}]
      }
    },
    "totalElements": 25,
    "totalPages": 3,
    "first": true,
    "last": false,
    "numberOfElements": 10
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/users"
}
```

**Response Structure:**
- Returns Spring Data `Page<UserDetailsSummaryResponseDTO>`
- Each user summary includes: `userId`, `email`, `username`, `accountStatus`
- Standard pagination metadata with page information

**Features:**
- Admin-only access control
- Multi-criteria filtering (status, search)
- Full-text search on username and email
- Pagination and sorting support
- User summary information

**Account Status Values:**
- `ACTIVE`: Normal active user
- `SUSPENDED`: Temporarily suspended user
- `DEACTIVATED`: Deactivated user account

### 3. Update User Profile Status (Admin)

#### Update User Account Status
```
PUT /api/users/profile-status
Authorization: Bearer token required (ADMIN role)
Content-Type: application/json

Body:
{
  "userId": 123,
  "profileStatus": "SUSPENDED"
}

Response: 200 OK
{
  "success": true,
  "message": "Profile status updated successfully",
  "data": "User status updated to SUSPENDED",
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/users/profile-status"
}
```

**Request Fields:**
- `userId` (required): The ID of the user to update
- `profileStatus` (required): New account status (ACTIVE, SUSPENDED, DEACTIVATED)

**Features:**
- Admin-only access control
- Simple status change operation
- String confirmation response
- Immediate status application

**Error Scenarios:**
- User not found → 404 NOT_FOUND
- Admin role required → 403 FORBIDDEN
- Invalid status value → 400 BAD_REQUEST

## Database Model

### User Entity
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;
    
    @Column(nullable = false, unique = true, length = 100)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false, unique = true, length = 50)
    private String username;
    
    @Column(name = "profile_picture_url", length = 255)
    private String profilePictureUrl;
    
    @Column(name = "cover_photo_url", length = 255)
    private String coverPhotoUrl;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;
    
    @Column(length = 100)
    private String designation;
    
    @Column(columnDefinition = "TEXT")
    private String summary;
    
    @Column(name = "is_verified")
    private Boolean isVerified = false;
    
    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false)
    private AccountStatus accountStatus = AccountStatus.DEACTIVATED;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "last_seen")
    private LocalDateTime lastSeen;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private Set<UserInterest> interests;
}
```

**Key Features:**
- Unique constraints on email and username
- Enum-based role and account status management
- Automatic timestamp tracking with `@PrePersist` and `@PreUpdate`
- Integration with UserInterest system
- File URL storage for profile and cover photos

### Enums
- **AccountStatus**: ACTIVE, SUSPENDED, DEACTIVATED
- **Role**: USER, MODERATOR, ADMIN

## Security & Authorization

### Authentication
- Profile update requires valid JWT token
- Uses `@PreAuthorize("isAuthenticated()")` for profile operations

### Authorization
- Admin operations require `ROLE_ADMIN`
- Uses `@PreAuthorize("hasRole('ROLE_ADMIN')")` for admin endpoints
- Users can only update their own profiles

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": ["Specific error details"],
  "timestamp": 1751455561337,
  "path": "/api/users/endpoint"
}
```

### Status Codes
- **200 OK**: Successful operation
- **400 BAD_REQUEST**: Invalid input data
- **401 UNAUTHORIZED**: Authentication required
- **403 FORBIDDEN**: Admin role required
- **404 NOT_FOUND**: User not found
- **409 CONFLICT**: Username already exists
- **413 PAYLOAD_TOO_LARGE**: File size exceeded

## Bruno API Test Suite

Your existing Bruno API test collection in `Kaleidoscope-api-test/users/`:

1. **folder.bru** - Collection configuration
2. Additional user management tests

### Test Features:
- Environment variables for base URL and tokens
- File upload testing for profile images
- Admin role validation
- Error scenario testing

## Service Implementation

### Key Methods
- `updateUserProfile(Long userId, UpdateUserProfileRequestDTO)`: Updates user profile with file handling
- `getUsersByFilters(String status, String search, Pageable)`: Admin method for filtered user retrieval
- `updateUserProfileStatus(Long userId, String profileStatus)`: Admin method for status updates

### File Handling
- Multipart file support for profile and cover photos
- Image processing and URL generation
- File validation and error handling

This user management system provides essential profile management capabilities with proper admin controls and file upload support for the Kaleidoscope application.
