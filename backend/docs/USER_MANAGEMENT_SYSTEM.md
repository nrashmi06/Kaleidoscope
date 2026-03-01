# Kaleidoscope User Management System Documentation

## Overview
The Kaleidoscope User Management System provides comprehensive user profile management, preferences, interests, social features (following, blocking), and notification controls. It integrates seamlessly with the authentication system and supports advanced user discovery and social networking features.

## Architecture Components

### Core Technologies
- **Spring Data JPA**: User entity management and relationships
- **File Upload Management**: Profile pictures and cover photos
- **Social Graph**: Following/follower relationships
- **Interest-based Recommendations**: Category-based user interests
- **Privacy Controls**: Granular privacy and notification preferences
- **Account Status Management**: User lifecycle and verification

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   User API       │    │   File Storage      │
│   (Profile Mgmt)│───▶│   Controller     │───▶│   (Images)          │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                          
                                ▼                          
                       ┌──────────────────┐    ┌─────────────────────┐
                       │   User Service   │    │   Notification      │
                       │   - Profile CRUD │───▶│   Preferences       │
                       │   - Social Graph │    │   Management        │
                       │   - Interests    │    └─────────────────────┘
                       └──────────────────┘                
                                │                          
                                ▼                          
                       ┌──────────────────┐    ┌─────────────────────┐
                       │   PostgreSQL     │    │   Authentication    │
                       │   - Users        │◀───│   Integration       │
                       │   - Preferences  │    │   (Auth System)     │
                       │   - Interests    │    └─────────────────────┘
                       │   - Social Graph │                
                       └──────────────────┘                
```

## Component Structure

```
users/
├── consumer/
│   └── UserProfileFaceEmbeddingConsumer.java  # Syncs face embeddings to ES
├── controller/
│   ├── UserController.java                    # Main user profile operations
│   ├── FollowController.java                  # Follow/unfollow & suggestions
│   ├── UserBlockController.java               # User blocking features
│   ├── UserInterestController.java            # Interest management
│   ├── UserNotificationPreferencesController.java # Notification settings
│   ├── UserPreferencesController.java         # User preferences management
│   └── api/                                   # OpenAPI interface definitions
│       ├── UserApi.java
│       ├── FollowApi.java
│       ├── UserBlockApi.java
│       ├── UserInterestApi.java
│       ├── UserNotificationPreferencesApi.java
│       └── UserPreferencesApi.java
├── document/
│   ├── UserDocument.java                      # Elasticsearch user document
│   ├── UserProfileDocument.java               # User profile search document
│   ├── FollowDocument.java                    # Follow relationship ES document
│   ├── FaceSearchDocument.java                # Face search ES document
│   └── UserFaceEmbeddingDocument.java         # Face embedding ES document
├── dto/
│   ├── request/                               # User update/preference requests
│   └── response/                              # User profile responses
├── enums/
│   ├── FollowStatus.java                      # PENDING, ACCEPTED, REJECTED
│   ├── Theme.java                             # UI theme preferences
│   └── Visibility.java                        # Profile visibility settings
├── exception/
│   └── user/                                  # User-specific exceptions
├── mapper/                                    # Entity-DTO mapping
├── model/
│   ├── User.java                              # Main user entity
│   ├── UserPreferences.java                   # User preferences
│   ├── UserInterest.java                      # User interests/categories
│   ├── UserNotificationPreferences.java       # Notification settings
│   ├── UserBlock.java                         # Blocking relationships
│   ├── Follow.java                            # Follow relationships
│   ├── FollowRequest.java                     # Pending follow requests
│   └── UserFaceEmbedding.java                 # User face embedding data
├── repository/
│   ├── UserRepository.java                    # User data access
│   ├── UserPreferencesRepository.java         # Preferences queries
│   ├── UserInterestRepository.java            # Interest management
│   ├── UserNotificationPreferencesRepository.java # Notification prefs queries
│   ├── UserBlockRepository.java               # Blocking queries
│   ├── FollowRepository.java                  # Follow relationship queries
│   ├── FollowRequestRepository.java           # Follow request queries
│   ├── UserFaceEmbeddingRepository.java       # Face embedding queries
│   ├── search/                                # Elasticsearch repositories
│   │   ├── UserSearchRepository.java
│   │   ├── UserSearchRepositoryCustom.java
│   │   ├── UserSearchRepositoryImpl.java
│   │   ├── UserProfileSearchRepository.java
│   │   ├── FollowSearchRepository.java
│   │   ├── FaceSearchRepository.java
│   │   └── UserFaceEmbeddingSearchRepository.java
│   └── specifications/                        # Dynamic query building
├── routes/                                    # Route constants
└── service/
    ├── UserService.java                       # Main user business logic
    ├── FollowService.java                     # Follow/unfollow & suggestions
    ├── FollowDocumentSyncService.java         # ES follow document sync
    ├── UserDocumentSyncService.java           # ES user document sync
    ├── UserBlockService.java                  # User blocking service
    ├── UserInterestService.java               # Interest management
    ├── UserNotificationPreferencesService.java # Notification preferences
    ├── UserPreferencesService.java            # User preferences management
    └── impl/
        ├── UserServiceImpl.java
        ├── FollowServiceImpl.java
        ├── FollowDocumentSyncServiceImpl.java
        ├── UserDocumentSyncServiceImpl.java
        ├── UserBlockServiceImpl.java
        ├── UserInterestServiceImpl.java
        ├── UserNotificationPreferencesServiceImpl.java
        └── UserPreferencesServiceImpl.java
```

### Redis Stream Consumer

**UserProfileFaceEmbeddingConsumer**: Listens to `user-profile-face-embedding-results` stream from the ML service, parses the face embedding vector, and syncs it to the `UserDocument` in Elasticsearch via `UserDocumentSyncService`.

### Elasticsearch Sync Services

- **UserDocumentSyncService**: Syncs user profile data and face embeddings to `UserDocument` in Elasticsearch
- **FollowDocumentSyncService**: Syncs follow relationships to `FollowDocument` in Elasticsearch

## Core Data Models

### User Entity
The central user profile entity:

```java
@Entity
public class User {
    private Long userId;
    private String email;                    // Unique email address
    private String password;                 // Encrypted password
    private String username;                 // Unique username
    private String profilePictureUrl;        // Profile image URL
    private String coverPhotoUrl;            // Cover photo URL
    private Role role;                       // USER, ADMIN, MODERATOR
    private String designation;              // Job title/role
    private String summary;                  // User bio/description
    private Boolean isVerified;              // Verification badge
    private LocalDateTime emailVerifiedAt;   // Email verification timestamp
    private AccountStatus accountStatus;     // ACTIVE, DEACTIVATED, SUSPENDED
    private LocalDateTime lastSeen;          // Last activity timestamp
    private Set<UserInterest> interests;     // User interests/categories
}
```

### UserPreferences Entity
Comprehensive user preferences management:

```java
@Entity
public class UserPreferences {
    private Long preferenceId;
    private User user;                       // Associated user (OneToOne)
    private Theme theme;                     // LIGHT, DARK, SYSTEM (default: SYSTEM)
    private String language;                 // Language code e.g. "en-US" (default: "en-US")
    private Visibility profileVisibility;    // PUBLIC, PRIVATE, FRIENDS_ONLY (default: PUBLIC)
    private Visibility allowMessages;        // Who can message (default: FRIENDS_ONLY)
    private Visibility allowTagging;         // Who can tag user (default: PUBLIC)
    private Visibility viewActivity;         // Who sees activity (default: FRIENDS_ONLY)
    private Boolean showEmail;               // Email visibility in profile (default: false)
    private Boolean showPhone;               // Phone visibility (default: false)
    private Boolean showOnlineStatus;        // Show online/offline status (default: true)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### UserNotificationPreferences Entity
Granular per-channel notification control (email + push for each event type):

```java
@Entity
public class UserNotificationPreferences {
    private Long preferenceId;
    private User user;                       // Associated user (OneToOne)
    
    // Likes - separate email and push toggles
    private Boolean likesEmail;              // Email on likes (default: true)
    private Boolean likesPush;               // Push on likes (default: true)
    
    // Comments
    private Boolean commentsEmail;           // Email on comments (default: true)
    private Boolean commentsPush;            // Push on comments (default: true)
    
    // Follows
    private Boolean followsEmail;            // Email on new followers (default: true)
    private Boolean followsPush;             // Push on new followers (default: true)
    
    // Mentions
    private Boolean mentionsEmail;           // Email on mentions (default: true)
    private Boolean mentionsPush;            // Push on mentions (default: true)
    
    // System notifications
    private Boolean systemEmail;             // Email for system alerts (default: true)
    private Boolean systemPush;              // Push for system alerts (default: true)
    
    // Follow requests
    private Boolean followRequestPush;       // Push on follow requests (default: true)
    private Boolean followAcceptPush;        // Push on follow accepts (default: true)
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### UserInterest Entity
Category-based user interests for recommendations:

```java
@Entity
public class UserInterest {
    private Long userInterestId;
    private User user;                       // Associated user
    private Category category;               // Interest category
    private Integer interestLevel;           // Interest strength (1-10)
    private LocalDateTime addedAt;           // When interest was added
    private Boolean isActive;                // Interest is currently active
}
```

### Social Relationship Entities

#### Follow Entity
```java
@Entity
public class Follow {
    private Long followId;
    private User follower;                   // User who follows
    private User following;                  // User being followed
    private FollowStatus status;             // PENDING, ACCEPTED, REJECTED
    private LocalDateTime followedAt;        // When relationship started
}
```

#### FollowRequest Entity
```java
@Entity
public class FollowRequest {
    private Long requestId;
    private User requester;                  // User requesting to follow
    private User target;                     // User being requested
    private FollowStatus status;             // PENDING, ACCEPTED, REJECTED
    private LocalDateTime requestedAt;
}
```

#### UserBlock Entity
```java
@Entity
public class UserBlock {
    private Long blockId;
    private User blocker;                    // User who blocks
    private User blocked;                    // User being blocked
    private LocalDateTime blockedAt;         // When block was created
    private String reason;                   // Optional block reason
}
```

## User Lifecycle Management

### Account Status Flow
```mermaid
stateDiagram-v2
    [*] --> PENDING: Registration
    PENDING --> ACTIVE: Email Verification
    ACTIVE --> DEACTIVATED: User Deactivates
    DEACTIVATED --> ACTIVE: User Reactivates
    ACTIVE --> SUSPENDED: Admin Action
    SUSPENDED --> ACTIVE: Admin Reinstatement
    DEACTIVATED --> [*]: Account Deletion
    SUSPENDED --> [*]: Permanent Ban
```

### Account Status Types
- **PENDING**: Newly registered, awaiting email verification
- **ACTIVE**: Fully active account with all features
- **DEACTIVATED**: User-initiated temporary deactivation
- **SUSPENDED**: Admin-initiated suspension for violations

### Email Verification Integration
- Integrated with authentication system's email verification
- `emailVerifiedAt` timestamp tracks verification
- Unverified users have limited functionality

## Profile Management Features

### Profile Picture & Cover Photo
- **Upload Support**: Image upload with validation
- **Automatic Processing**: Thumbnail generation and optimization
- **File Storage**: Cloud storage integration
- **Privacy Controls**: Visibility settings for profile images

### Bio and Professional Information
- **Summary**: Rich text bio/description
- **Designation**: Professional title or role
- **Verification Badge**: Manual verification for notable users
- **Custom Fields**: Extensible profile information

### Privacy Controls
```java
// Privacy settings in UserPreferences
public class UserPreferences {
    private Boolean profileVisibility;       // Public profile access
    private Boolean showEmail;               // Email display in profile
    private Boolean allowTagging;            // User tagging permissions
    private Boolean showOnlineStatus;        // Online status visibility
    private Boolean allowDirectMessages;     // DM permissions
    private PrivacyLevel postVisibility;     // Default post privacy
    private Boolean indexProfile;            // Search engine indexing
}
```

## Social Features

### Following System
- **Asymmetric Following**: Users can follow without mutual consent
- **Following Feed**: Personalized content from followed users
- **Notification Options**: Optional notifications for followed users' activities
- **Follow Recommendations**: AI-powered user suggestions

### Blocking System
- **Complete Blocking**: Blocked users cannot see profile or content
- **Mutual Invisibility**: Blocker and blocked user invisible to each other
- **Content Filtering**: Blocked users' content filtered from feeds
- **Interaction Prevention**: Prevents all forms of interaction

### User Discovery
```java
// Search for users
@GetMapping("/users/search")
public ResponseEntity<PaginatedResponse<UserSearchResponseDTO>> searchUsers(
    @RequestParam String query,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size);

// Get user recommendations
@GetMapping("/users/recommendations")
public ResponseEntity<List<UserRecommendationResponseDTO>> getUserRecommendations();

// Get mutual followers
@GetMapping("/users/{userId}/mutual-followers")
public ResponseEntity<List<UserSummaryResponseDTO>> getMutualFollowers(
    @PathVariable Long userId);
```

## Interest-Based Recommendations

### Interest Management
Users can select interests from predefined categories:
- **Technology**: Programming, AI, Gadgets
- **Photography**: Portraits, Landscapes, Street Photography
- **Travel**: Adventure, Culture, Food
- **Lifestyle**: Fitness, Fashion, Health
- **Arts**: Music, Design, Literature

### Interest-Based Features
- **Content Recommendations**: Posts matching user interests
- **User Suggestions**: Users with similar interests
- **Trending Topics**: Popular content in user's interest areas
- **Personalized Feed**: Algorithm considers user interests

### Interest Scoring
```java
public class UserInterest {
    private Integer interestLevel;           // 1-10 interest strength
    // Dynamic scoring based on:
    // - User engagement with category content
    // - Time spent viewing related posts
    // - Interaction frequency with category
    // - Explicit user rating
}
```

## Notification Preferences

### Notification Types
- **Email Notifications**: Important updates via email
- **Push Notifications**: Real-time mobile/browser notifications
- **In-App Notifications**: Notification center within application

### Granular Controls
```java
public class UserNotificationPreferences {
    // Per-event email + push toggle pairs
    private Boolean likesEmail;              // Email on likes
    private Boolean likesPush;               // Push on likes
    private Boolean commentsEmail;           // Email on comments
    private Boolean commentsPush;            // Push on comments
    private Boolean followsEmail;            // Email on new followers
    private Boolean followsPush;             // Push on new followers
    private Boolean mentionsEmail;           // Email on mentions
    private Boolean mentionsPush;            // Push on mentions
    private Boolean systemEmail;             // Email for system alerts
    private Boolean systemPush;              // Push for system alerts
    private Boolean followRequestPush;       // Push on follow requests
    private Boolean followAcceptPush;        // Push on follow accepts
}
```

### Smart Notification Features
- **Per-Channel Control**: Independent email and push toggles per event type
- **Intelligent Filtering**: Reduce notification fatigue
- **Priority System**: Important notifications bypass filters

## User Search and Discovery

### Elasticsearch Integration
```java
@Document(indexName = "users")
public class UserDocument {
    private String userId;
    private String username;
    private String email;                    // Searchable if public
    private String summary;                  // Bio content
    private String designation;              // Professional title
    private List<String> interests;          // User interest categories
    private Boolean isVerified;              // Verification status
    private LocalDateTime lastSeen;          // Activity recency
    private Long followerCount;              // Social proof
    private Double engagementScore;          // Activity level
}
```

### Search Features
- **Username Search**: Exact and partial username matching
- **Bio Search**: Full-text search in user summaries
- **Interest-Based Discovery**: Find users with similar interests
- **Location-Based Search**: Users in specific geographic areas
- **Verification Filter**: Filter by verified users
- **Activity Filter**: Find recently active users

## Privacy and Security

### Data Protection
- **GDPR Compliance**: Full user data export and deletion
- **Privacy by Design**: Default privacy-friendly settings
- **Data Minimization**: Only collect necessary information
- **Consent Management**: Explicit consent for data processing

### Security Features
```java
@PreAuthorize("@userSecurityService.canViewProfile(#userId, authentication.name)")
@GetMapping("/users/{userId}")
public ResponseEntity<UserProfileResponseDTO> getUserProfile(@PathVariable Long userId);

@PreAuthorize("@userSecurityService.canEditProfile(#userId, authentication.name)")
@PutMapping("/users/{userId}")
public ResponseEntity<UserProfileResponseDTO> updateUserProfile(
    @PathVariable Long userId, 
    @RequestBody UserUpdateRequestDTO request);
```

### Access Control
- **Profile Visibility**: Control who can view profile
- **Contact Information**: Hide sensitive data from public
- **Activity Privacy**: Control visibility of online status
- **Search Privacy**: Opt-out of search engine indexing

## API Endpoints Reference

### Profile Management
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile
- `POST /api/users/{id}/upload-profile-picture` - Upload profile picture
- `POST /api/users/{id}/upload-cover-photo` - Upload cover photo
- `GET /api/users/me` - Get current user profile

### Preferences Management
- `GET /api/users/{id}/preferences` - Get user preferences
- `PUT /api/users/{id}/preferences` - Update preferences
- `GET /api/users/{id}/notification-preferences` - Get notification settings
- `PUT /api/users/{id}/notification-preferences` - Update notifications

### Social Features
- `POST /api/users/{id}/follow` - Follow user
- `DELETE /api/users/{id}/follow` - Unfollow user
- `GET /api/users/{id}/followers` - Get followers list
- `GET /api/users/{id}/following` - Get following list
- `POST /api/users/{id}/block` - Block user
- `DELETE /api/users/{id}/block` - Unblock user

### Interest Management
- `GET /api/users/{id}/interests` - Get user interests
- `POST /api/users/{id}/interests` - Add interest
- `DELETE /api/users/{id}/interests/{interestId}` - Remove interest
- `GET /api/categories` - Get available interest categories

### Discovery and Search
- `GET /api/users/search` - Search users
- `GET /api/users/recommendations` - Get user recommendations
- `GET /api/users/trending` - Get trending/popular users

## Performance Optimization

### Caching Strategy
- **Profile Caching**: Cache frequently accessed profiles
- **Preferences Caching**: Cache user preferences for quick access
- **Social Graph Caching**: Cache follower/following relationships
- **Search Result Caching**: Cache popular search queries

### Database Optimization
- **Indexes**: Optimized queries for user search and discovery
- **Connection Pooling**: Efficient database connections
- **Read Replicas**: Separate read/write operations
- **Partitioning**: Large table partitioning by user ID

## Monitoring and Analytics

### Key Metrics
- **User Registration Rate**: New user signups over time
- **Profile Completion Rate**: Users with complete profiles
- **Social Graph Growth**: Following/follower relationship growth
- **Feature Adoption**: Usage of preferences and privacy features
- **Search Performance**: User discovery and search metrics

### User Analytics
- **Activity Tracking**: User engagement patterns
- **Feature Usage**: Most used profile features
- **Social Metrics**: Following patterns and relationship analysis
- **Content Preferences**: Interest-based behavior analysis

## Testing Strategy

### Unit Testing
- User service business logic
- Privacy control validation
- Interest management functionality
- Social relationship handling

### Integration Testing
- Profile API endpoints
- File upload functionality
- Search integration
- Notification preference updates

### Security Testing
- Access control validation
- Privacy setting enforcement
- Data protection compliance
- Authentication integration

## Future Enhancements

### Planned Features
- **Advanced User Analytics**: Detailed user behavior insights
- **Smart Recommendations**: ML-powered user and content suggestions
- **Advanced Privacy Controls**: Granular visibility settings
- **Social Features**: Groups, communities, events
- **Professional Networking**: LinkedIn-style professional features

### Technical Improvements
- **Real-time Status**: WebSocket integration for online status
- **Advanced Search**: Machine learning-enhanced user discovery
- **Mobile Optimization**: Mobile-specific features and APIs
- **Internationalization**: Multi-language support expansion

This comprehensive User Management System documentation covers all aspects of user profiles, preferences, social features, and privacy controls that power the Kaleidoscope platform's user experience.
