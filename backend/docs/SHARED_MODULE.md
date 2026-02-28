# Kaleidoscope Shared Module Documentation

## Overview

The Shared Module (`shared/`) provides cross-cutting concerns, common utilities, and reusable components used across all feature modules. It houses shared controllers, services, models, configurations, and response wrappers that prevent code duplication between the posts, blogs, users, and other modules.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Structure](#module-structure)
3. [Shared Controllers](#shared-controllers)
4. [Shared Services](#shared-services)
5. [Response Wrappers](#response-wrappers)
6. [Shared Models](#shared-models)
7. [Shared Enums](#shared-enums)
8. [Configuration Classes](#configuration-classes)
9. [Scheduler](#scheduler)
10. [Elasticsearch Sync](#elasticsearch-sync)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SHARED MODULE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Controllers     │  │  Services        │  │  Configuration   │   │
│  │  • Category      │  │  • Interaction   │  │  • AsyncConfig   │   │
│  │  • Hashtag       │  │  • Category      │  │  • CloudinaryConf│   │
│  │  • Location      │  │  • Hashtag       │  │  • OpenApiConfig │   │
│  │  • UserTag       │  │  • Location      │  │  • CorrIdFilter  │   │
│  │  • Diagnostic    │  │  • UserTag       │  │  • AppProperties │   │
│  │                  │  │  • ImageStorage  │  │  • ServletProps  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Models          │  │  Repositories    │  │  Response        │   │
│  │  • Category      │  │  • Category      │  │  • AppResponse   │   │
│  │  • Hashtag       │  │  • Hashtag       │  │  • Paginated     │   │
│  │  • Location      │  │  • Location      │  │    Response      │   │
│  │  • Comment       │  │  • Comment       │  └──────────────────┘   │
│  │  • Reaction      │  │  • Reaction      │                        │
│  │  • UserTag       │  │  • UserTag       │  ┌──────────────────┐   │
│  │  • PostHashtag   │  │  • PostHashtag   │  │  Scheduler       │   │
│  │  • MediaAsset    │  │  • MediaAsset    │  │  • MediaCleanup  │   │
│  │    Tracker       │  │    Tracker       │  └──────────────────┘   │
│  └──────────────────┘  └──────────────────┘                        │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │  Enums           │  │  Sync            │                        │
│  │  • ContentType   │  │  • ES Startup    │                        │
│  │  • ReactionType  │  │    Sync Service  │                        │
│  │  • MediaType     │  └──────────────────┘                        │
│  │  • Role          │                                               │
│  │  • AccountStatus │                                               │
│  │  • + more        │                                               │
│  └──────────────────┘                                               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Module Structure

```
shared/
├── config/
│   ├── ApplicationProperties.java        # Custom app properties binding
│   ├── AsyncConfig.java                   # @EnableAsync + taskExecutor thread pool
│   ├── CloudinaryConfig.java              # Cloudinary SDK configuration
│   ├── CorrelationIdFilter.java           # Request correlation ID filter
│   ├── OpenApiConfig.java                 # SpringDoc OpenAPI 3 configuration
│   └── ServletProperties.java            # Servlet context configuration
├── controller/
│   ├── CategoryController.java            # Category CRUD endpoints
│   ├── DiagnosticController.java          # System diagnostic endpoints
│   ├── HashtagController.java             # Hashtag trending & search
│   ├── LocationController.java            # Location search & CRUD
│   ├── UserTagController.java             # User tagging in content
│   └── api/
│       ├── CategoryApi.java               # Category OpenAPI interface
│       ├── HashtagApi.java                # Hashtag OpenAPI interface
│       ├── LocationApi.java               # Location OpenAPI interface
│       └── UserTagApi.java                # UserTag OpenAPI interface
├── dto/
│   ├── request/                           # Shared request DTOs
│   │   ├── CategoryRequestDTO.java
│   │   ├── CommentCreateRequestDTO.java
│   │   ├── CreateUserTagRequestDTO.java
│   │   ├── LocationRequestDTO.java
│   │   └── ReactionRequestDTO.java
│   └── response/                          # Shared response DTOs
│       ├── CategoryResponseDTO.java
│       ├── CommentResponseDTO.java
│       ├── HashtagResponseDTO.java
│       ├── LocationResponseDTO.java
│       ├── ReactionResponseDTO.java
│       └── UserTagResponseDTO.java
├── enums/
│   ├── AccountStatus.java                 # ACTIVE, DEACTIVATED, SUSPENDED
│   ├── CommentStatus.java                 # ACTIVE, DELETED
│   ├── ContentType.java                   # POST, BLOG, COMMENT
│   ├── MediaAssetStatus.java              # PENDING, ASSOCIATED, MARKED_FOR_DELETE
│   ├── MediaType.java                     # IMAGE, VIDEO
│   ├── NotificationType.java             # FOLLOW, COMMENT, REACTION, etc.
│   ├── ReactionType.java                  # LIKE, LOVE, HAHA, WOW, SAD, ANGRY
│   └── Role.java                          # ADMIN, MODERATOR, USER
├── exception/                             # Shared exception classes
├── mapper/                                # Shared entity-DTO mappers
├── model/
│   ├── Category.java                      # Content categories (hierarchical)
│   ├── Comment.java                       # Comments (polymorphic via ContentType)
│   ├── Hashtag.java                       # Hashtags with usage count
│   ├── Location.java                      # Geographic locations
│   ├── MediaAssetTracker.java             # Cloudinary upload tracking
│   ├── PostHashtag.java                   # Post-hashtag junction table
│   ├── Reaction.java                      # Reactions (polymorphic via ContentType)
│   └── UserTag.java                       # User tags in content
├── repository/
│   ├── CategoryRepository.java
│   ├── CommentRepository.java
│   ├── HashtagRepository.java
│   ├── LocationRepository.java
│   ├── MediaAssetTrackerRepository.java
│   ├── PostHashtagRepository.java
│   ├── ReactionRepository.java
│   └── UserTagRepository.java
├── response/
│   ├── AppResponse.java                   # Standardized API response wrapper
│   └── PaginatedResponse.java             # Paginated response wrapper
├── routes/
│   ├── CategoryRoutes.java
│   ├── HashtagRoutes.java
│   ├── LocationRoutes.java
│   └── UserTagRoutes.java
├── scheduler/
│   └── MediaAssetCleanupScheduler.java    # Hourly orphaned media cleanup
├── service/
│   ├── CategoryService.java               # Category business logic
│   ├── HashtagService.java                # Hashtag management
│   ├── ImageStorageService.java           # Cloudinary upload signatures
│   ├── InteractionService.java            # Unified reactions & comments
│   ├── LocationService.java               # Location management
│   ├── UserTagService.java                # User tagging logic
│   └── impl/
│       ├── CategoryServiceImpl.java
│       ├── HashtagServiceImpl.java
│       ├── ImageStorageServiceImpl.java
│       ├── InteractionServiceImpl.java
│       ├── LocationServiceImpl.java
│       └── UserTagServiceImpl.java
└── sync/
    └── ElasticsearchStartupSyncService.java  # Startup data sync to ES
```

## Shared Controllers

### CategoryController

Manages content categories used by both posts and blogs. Supports hierarchical parent-child categories.

| Endpoint                           | Method | Auth        | Description                     |
|------------------------------------|--------|-------------|---------------------------------|
| `GET /api/categories`              | GET    | Authenticated | Get all parent categories (paginated) |
| `GET /api/categories/{id}/sub`     | GET    | Authenticated | Get subcategories for a parent  |
| `POST /api/categories`             | POST   | Admin only  | Create a new category           |
| `PUT /api/categories/{id}`         | PUT    | Admin only  | Update a category               |
| `DELETE /api/categories/{id}`      | DELETE | Admin only  | Delete a category               |

### HashtagController

Manages hashtags with trending and autocomplete suggestions.

| Endpoint                           | Method | Auth        | Description                     |
|------------------------------------|--------|-------------|---------------------------------|
| `GET /api/hashtags/trending`       | GET    | Public      | Get trending hashtags (paginated) |
| `GET /api/hashtags/suggest`        | GET    | Public      | Autocomplete hashtags by prefix |
| `GET /api/hashtags/{name}`         | GET    | Public      | Get hashtag details by name     |

### LocationController

Manages geographic locations for posts and blogs.

| Endpoint                           | Method | Auth        | Description                     |
|------------------------------------|--------|-------------|---------------------------------|
| `GET /api/locations`               | GET    | Authenticated | Search locations (paginated)    |
| `POST /api/locations`              | POST   | Authenticated | Create a new location           |
| `GET /api/locations/{id}`          | GET    | Authenticated | Get location by ID              |
| `PUT /api/locations/{id}`          | PUT    | Authenticated | Update a location               |
| `DELETE /api/locations/{id}`       | DELETE | Authenticated | Delete a location               |

### UserTagController

Manages user tagging in posts and blogs.

| Endpoint                           | Method | Auth        | Description                     |
|------------------------------------|--------|-------------|---------------------------------|
| `GET /api/user-tags/taggable`      | GET    | Authenticated | Search taggable users           |
| `POST /api/user-tags`              | POST   | Authenticated | Create a user tag               |
| `GET /api/user-tags/content`       | GET    | Authenticated | Get tags for a content item     |
| `DELETE /api/user-tags/{id}`       | DELETE | Authenticated | Remove a user tag               |

## Shared Services

### InteractionService

The **most critical shared service** — provides a unified interface for reactions and comments across all content types (POST, BLOG, COMMENT). Used by both `PostInteractionController` and `BlogInteractionController`.

```java
public interface InteractionService {
    ReactionResponseDTO reactOrUnreact(ContentType contentType, Long contentId,
                                        ReactionType reactionType, boolean unreact);
    ReactionResponseDTO getReactionSummary(ContentType contentType, Long contentId);
    CommentResponseDTO addComment(ContentType contentType, Long contentId,
                                   CommentCreateRequestDTO requestDTO);
    Page<CommentResponseDTO> listComments(ContentType contentType, Long contentId,
                                           Pageable pageable);
    void deleteComment(Long contentId, Long commentId);
}
```

**Key Features:**
- Polymorphic reactions via `ContentType` (POST, BLOG, COMMENT)
- 6 reaction types: LIKE, LOVE, HAHA, WOW, SAD, ANGRY
- Toggle behavior: same reaction type unreacts, different type switches
- Publishes notification events via Redis Stream after reactions/comments
- Publishes interaction sync events for Elasticsearch updates

### ImageStorageService

Handles Cloudinary upload signature generation and media lifecycle management.

**Key Features:**
- Generates signed upload URLs for frontend direct-to-Cloudinary uploads
- Tracks uploads via `MediaAssetTracker`
- Validates media URLs against tracker records
- Deletes media from Cloudinary by public ID

### HashtagService

Manages hashtag lifecycle — parsing from content, find-or-create, trending, suggestions.

For detailed documentation, see [HASHTAG_SYSTEM.md](HASHTAG_SYSTEM.md).

## Response Wrappers

### AppResponse\<T\>

Standardized API response wrapper used by all endpoints:

```java
@Builder
public class AppResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private List<String> errors;
    private long timestamp;
    private String path;
}
```

### PaginatedResponse\<T\>

Paginated response wrapper with convenience factory method:

```java
public class PaginatedResponse<T> {
    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
    private boolean hasNext;
    private boolean hasPrevious;
    private boolean isFirst;
    private boolean isLast;

    public static <T> PaginatedResponse<T> fromPage(Page<T> page) { ... }
}
```

## Shared Models

### Comment (Polymorphic)

A single `Comment` entity handles comments on posts, blogs, and other comments:

- `contentType` — POST, BLOG, or COMMENT (enables nested replies)
- `contentId` — ID of the target content
- `user` — Comment author
- `body` — Comment text
- `status` — ACTIVE or DELETED (soft delete)

### Reaction (Polymorphic)

A single `Reaction` entity handles reactions on posts, blogs, and comments:

- `contentType` — POST, BLOG, or COMMENT
- `contentId` — ID of the target content
- `user` — User who reacted
- `reactionType` — LIKE, LOVE, HAHA, WOW, SAD, ANGRY

### MediaAssetTracker

Tracks all Cloudinary uploads through their lifecycle:

- `publicId` — Cloudinary public_id
- `userId` — Uploader
- `contentType` — BLOG or POST
- `contentId` — Associated content ID
- `status` — PENDING → ASSOCIATED → MARKED_FOR_DELETE

For detailed documentation, see [IMAGE_STORAGE_SYSTEM.md](IMAGE_STORAGE_SYSTEM.md).

## Shared Enums

| Enum                | Values                                          | Used By              |
|--------------------|-------------------------------------------------|----------------------|
| `ContentType`      | POST, BLOG, COMMENT                             | Interactions, Tags   |
| `ReactionType`     | LIKE, LOVE, HAHA, WOW, SAD, ANGRY              | Reactions            |
| `Role`             | USER, MODERATOR, ADMIN                          | Auth, Admin          |
| `AccountStatus`    | ACTIVE, DEACTIVATED, SUSPENDED                  | Users                |
| `MediaType`        | IMAGE, VIDEO                                    | Posts, Blogs         |
| `MediaAssetStatus` | PENDING, ASSOCIATED, MARKED_FOR_DELETE          | Image Storage        |
| `CommentStatus`    | ACTIVE, DELETED                                 | Comments             |
| `NotificationType` | FOLLOW, COMMENT, REACTION, MENTION, SYSTEM, etc | Notifications        |

## Configuration Classes

### AsyncConfig
Configures the `taskExecutor` thread pool for `@Async` methods:
- Core pool: 4, Max pool: 8, Queue: 500
- Thread prefix: `Async-`
- Waits for shutdown: 60s

### CloudinaryConfig
Configures Cloudinary SDK using environment variables for cloud name, API key, and API secret.

### CorrelationIdFilter
Servlet filter that:
- Generates or extracts correlation IDs from request headers
- Captures client IP, user agent, request method, URI
- Adds all to MDC for structured logging
- Propagates correlation ID to response headers

### OpenApiConfig
Configures SpringDoc OpenAPI 3 documentation with:
- API info, title, description
- JWT bearer authentication scheme
- Server URL configuration

## Scheduler

### MediaAssetCleanupScheduler
Runs every hour (`@Scheduled(fixedRate = 60 * 60 * 1000)`) to clean up orphaned media:
1. Finds assets with `MARKED_FOR_DELETE` or `PENDING` status older than 60 minutes
2. Deletes from Cloudinary via `ImageStorageService`
3. Removes tracker record from database
4. Handles per-asset failures gracefully

## Elasticsearch Sync

### ElasticsearchStartupSyncService
Runs on `ApplicationReadyEvent` to synchronize data from PostgreSQL to Elasticsearch:
- Batch sync (100 items per batch)
- Syncs Users → Posts → Blogs → Other documents
- Starts the Redis Stream listener container **after** sync completes
- Ensures search indices are populated on application startup

