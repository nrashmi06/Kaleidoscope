# Kaleidoscope Posts Management System Documentation

## Overview
The Kaleidoscope Posts Management System handles photo posts with media processing, AI-powered insights, and basic user interactions. It integrates with the ML pipeline for automated content analysis and provides search capabilities.

## Architecture Components

### Core Technologies
- **Spring Data JPA**: Entity relationship management
- **PostgreSQL**: Primary data storage
- **AI Integration**: ML pipeline for media insights
- **Soft Delete**: Audit-friendly deletion strategy
- **File Upload**: Media attachment handling

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   Posts API      │    │   ML Pipeline       │
│   (Create Post) │───▶│   Controller     │───▶│   (Media AI)        │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                          │
                                ▼                          ▼
                       ┌───────────���──────┐    ┌─────────────────────┐
                       │   Posts Service  │    │   AI Insights       │
                       │   - CRUD Ops     │    │   - Face Detection  │
                       │   - Media Mgmt   │    │   - Object Recog    │
                       └──────────────────┘    └─────────────────────┘
                                │                          │
                                ▼                          │
                       ┌──────────────────┐                │
                       │   PostgreSQL     │◀───────────────┘
                       │   - Posts        │
                       │   - Media        │
                       │   - AI Insights  │
                       └──────────────────┘
```

## Component Structure

```
posts/
├── controller/
│   ├── PostController.java              # Main posts CRUD operations
│   ├── PostInteractionController.java   # Post interactions (if implemented)
│   └── api/                            # OpenAPI interface definitions
├── document/
│   ├── PostDocument.java              # Elasticsearch post document
│   ├── MediaSearchDocument.java       # Media search indexing
│   ├── MediaAiInsightsDocument.java   # AI insights for search
│   └── MediaDetectedFaceDocument.java  # Face detection search
├── dto/
│   ├── request/                        # Post creation/update requests
│   └── response/                       # Post response formats
├── enums/
│   ├── PostStatus.java                # DRAFT, PUBLISHED, ARCHIVED
│   ├── PostVisibility.java            # PUBLIC, PRIVATE, FRIENDS_ONLY
│   └── MediaType.java                 # IMAGE, VIDEO, AUDIO
├── exception/
│   └── posts/                         # Post-specific exceptions
├── mapper/
│   └── PostMapper.java               # Entity-DTO mapping
├── model/
│   ├── Post.java                     # Main post entity
│   ├── PostMedia.java               # Media attachments
│   ├── PostCategory.java            # Post categorization
│   ├── PostSave.java                # Saved posts functionality
│   ├── MediaAiInsights.java         # AI processing results
│   └── MediaDetectedFace.java       # Face detection data
├── repository/
│   ├── PostRepository.java          # Post data access
│   ├── PostMediaRepository.java     # Media queries
│   └── specification/               # Dynamic query building
├── routes/
│   └── PostsRoutes.java            # Route constants
└── service/
    ├── PostService.java            # Main business logic
    └── impl/                       # Service implementations
```

## Core Data Models

### Post Entity
The central entity representing a user's post:

```java
@Entity
public class Post {
    private Long postId;
    private User user;                    // Post author
    private String title;                 // Post title (max 200 chars)
    private String body;                  // Post content (TEXT)
    private String summary;               // Brief summary (max 500 chars)
    private Location location;            // Geographic location
    private PostVisibility visibility;    // PUBLIC, PRIVATE, FRIENDS_ONLY
    private PostStatus status;            // DRAFT, PUBLISHED, ARCHIVED
    private LocalDateTime scheduledAt;    // Scheduled publishing time
    private LocalDateTime deletedAt;      // Soft delete timestamp
    private Set<PostMedia> media;         // Attached media files
    private Set<UserTag> userTags;        // Tagged users
    private Set<Category> categories;     // Content categories
}
```

### PostMedia Entity
Manages media attachments with AI processing:

```java
@Entity
public class PostMedia {
    private Long mediaId;
    private Post post;                    // Parent post
    private String fileName;              // Original filename
    private String fileUrl;               // Storage URL
    private String thumbnailUrl;          // Thumbnail URL
    private MediaType mediaType;          // IMAGE, VIDEO, AUDIO
    private Long fileSize;                // File size in bytes
    private String mimeType;              // MIME type
    private Integer displayOrder;         // Media ordering
    private MediaAiInsights aiInsights;   // AI processing results
    private Set<MediaDetectedFace> detectedFaces; // Face detection
}
```

### MediaAiInsights Entity
AI processing results for enhanced search:

```java
@Entity
public class MediaAiInsights {
    private Long insightId;
    private PostMedia media;              // Associated media
    private List<String> detectedObjects; // Objects in image
    private List<String> scenes;          // Scene classification
    private List<String> colors;          // Dominant colors
    private Double qualityScore;          // Image quality (0-1)
    private Boolean hasAdultContent;      // Content moderation
    private Boolean hasViolentContent;    // Violence detection
    private String dominantEmotion;       // Emotion in image
    private LocalDateTime processedAt;    // Processing timestamp
}
```

## Post Lifecycle Management

### Post Status Flow
```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create Post
    DRAFT --> PUBLISHED: Publish Now
    DRAFT --> SCHEDULED: Schedule for Later
    SCHEDULED --> PUBLISHED: Scheduled Time Reached
    PUBLISHED --> ARCHIVED: Archive Post
    ARCHIVED --> PUBLISHED: Republish
    PUBLISHED --> [*]: Soft Delete
    DRAFT --> [*]: Soft Delete
    ARCHIVED --> [*]: Soft Delete
```

### Visibility Control
- **PUBLIC**: Visible to all users
- **PRIVATE**: Visible only to post author
- **FRIENDS_ONLY**: Visible to friends/followers only

## Media Processing Pipeline

### Upload Flow
```mermaid
sequenceDiagram
    participant Client
    participant PostController
    participant PostService
    participant FileStorage
    participant MLPipeline
    participant Database

    Client->>PostController: Create post with media
    PostController->>PostService: Process post creation
    PostService->>FileStorage: Store media files
    PostService->>Database: Save post metadata
    PostService->>MLPipeline: Trigger AI processing
    MLPipeline->>Database: Store AI insights (async)
    PostController-->>Client: Post created successfully
```

### AI Processing Integration
1. **Image Upload**: Original image stored in file system/cloud
2. **ML Event Publishing**: Event sent to ML pipeline via Redis Streams
3. **AI Processing**: External ML service processes image
4. **Results Storage**: AI insights stored in database

## API Endpoints Reference

### Post Management
- `GET /api/posts` - Get posts with filtering/pagination
- `GET /api/posts/{id}` - Get specific post
- `POST /api/posts` - Create new post
- `PUT /api/posts/{id}` - Update post
- `DELETE /api/posts/{id}` - Soft delete post

### Media Management
- `POST /api/posts/generate-upload-signature` - Generate upload signature for media
- Media upload handled through generated signatures

### Filtering and Search
The system supports filtering posts by:
- User ID
- Category ID
- Post Status
- Post Visibility
- Search query

## Post Categories

### PostCategory Entity
Posts can be categorized using the category system:

```java
@Entity
public class PostCategory {
    private Long postCategoryId;
    private Post post;                    // Associated post
    private Category category;            // Category reference
    private LocalDateTime assignedAt;     // When category was assigned
}
```

## Saved Posts Feature

### PostSave Entity
Users can save posts for later viewing:

```java
@Entity
public class PostSave {
    private Long postSaveId;
    private Post post;                    // Saved post
    private User user;                    // User who saved
    private LocalDateTime savedAt;        // When post was saved
}
```

## Security and Access Control

### Post Access Control
The system implements security checks to ensure users can only:
- View posts based on visibility settings
- Edit their own posts
- Delete their own posts
- Access appropriate content based on permissions

## Media File Handling

### Upload Signature Generation
The system generates secure upload signatures for media files, allowing direct uploads to cloud storage while maintaining security.

### File Storage
- Original media files stored in cloud storage
- Thumbnail generation for images
- File validation and security checks
- Support for multiple media types (IMAGE, VIDEO, AUDIO)

## Integration Points

### With ML System
- Post media triggers ML processing pipeline
- AI insights stored and associated with media
- Face detection results linked to posts
- Content moderation through AI analysis

### With User System
- Posts linked to user accounts
- User tagging in posts
- Visibility controls based on user relationships

### With Category System
- Posts can be categorized for organization
- Category-based filtering and discovery

## Database Schema

### Key Relationships
- Post → User (many-to-one)
- Post → PostMedia (one-to-many)
- PostMedia → MediaAiInsights (one-to-one)
- PostMedia → MediaDetectedFace (one-to-many)
- Post → PostCategory (one-to-many)
- Post → PostSave (one-to-many)

### Soft Delete Implementation
Posts use soft delete with `deletedAt` timestamp, allowing for data recovery and audit trails.

This documentation covers the implemented Posts Management System features in the Kaleidoscope platform.
