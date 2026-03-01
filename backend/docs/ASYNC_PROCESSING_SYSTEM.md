# Kaleidoscope Async Processing System Documentation

## Overview

The Async Processing System (`async/` module) is the centralized hub for all event-driven, asynchronous processing in Kaleidoscope. It manages the Redis Stream infrastructure, coordinates ML pipeline consumers, handles read model updates for AI-powered search, and triggers downstream services like Elasticsearch sync and post aggregation.

> **Note:** This module was previously named `ml/` and has been expanded to encompass all async event processing beyond just ML tasks.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Structure](#module-structure)
3. [Redis Stream Configuration](#redis-stream-configuration)
4. [Stream Constants](#stream-constants)
5. [Consumers](#consumers)
6. [Services](#services)
7. [DTOs](#dtos)
8. [Error Handling](#error-handling)
9. [Consumer Registration Flow](#consumer-registration-flow)
10. [Cross-Module Consumers](#cross-module-consumers)

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ASYNC PROCESSING SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                External ML Service (Python)                   │   │
│  │  Publishes results to Redis Streams                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Redis Streams (Message Broker)                   │   │
│  │                                                               │   │
│  │  Inbound (ML → Backend):                                     │   │
│  │    • ml-insights-results                                      │   │
│  │    • face-detection-results                                   │   │
│  │    • face-recognition-results                                 │   │
│  │    • user-profile-face-embedding-results                     │   │
│  │    • post-insights-enriched                                   │   │
│  │                                                               │   │
│  │  Outbound (Backend → ML/Services):                           │   │
│  │    • profile-picture-processing                               │   │
│  │    • post-image-processing                                    │   │
│  │    • post-update-processing                                   │   │
│  │    • post-aggregation-trigger                                 │   │
│  │    • es-sync-queue                                            │   │
│  │                                                               │   │
│  │  Internal Sync (Backend → Backend):                           │   │
│  │    • post-interaction-sync                                    │   │
│  │    • blog-interaction-sync                                    │   │
│  │    • user-profile-post-sync                                   │   │
│  │    • user-profile-blog-sync                                   │   │
│  │    • hashtag-usage-sync-stream                                │   │
│  │    • notification-events                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         RedisStreamConfig (Consumer Registration)             │   │
│  │   • Creates consumer groups for all streams                  │   │
│  │   • Registers 11 consumers with unique names                 │   │
│  │   • Configures batch size (50) & poll timeout (2s)           │   │
│  │   • Custom error handler with NOGROUP auto-recovery          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│              ┌───────────────┼───────────────┐                       │
│              ▼               ▼               ▼                       │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐           │
│  │  ML Consumers  │ │ Sync Consumers │ │ Enrichment     │           │
│  │ • MediaAI      │ │ • PostInteract │ │ • PostInsights │           │
│  │ • FaceDetect   │ │ • BlogInteract │ │   Enriched     │           │
│  │ • FaceRecog    │ │ • UserProfile  │ │ • HashtagUsage │           │
│  │                │ │ • Notification │ │                │           │
│  └────────────────┘ └────────────────┘ └────────────────┘           │
│              │               │               │                       │
│              ▼               ▼               ▼                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Services Layer                                   │   │
│  │  • ReadModelUpdateService → read_model_* tables              │   │
│  │  • PostProcessingStatusService → check all media processed   │   │
│  │  • PostAggregationTriggerService → trigger AI aggregation    │   │
│  │  • ElasticsearchSyncTriggerService → trigger ES index sync   │   │
│  │  • RedisStreamPublisher → publish to outbound streams        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│              ┌───────────────┼───────────────┐                       │
│              ▼               ▼               ▼                       │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐           │
│  │  PostgreSQL    │ │  Elasticsearch │ │  Read Models   │           │
│  │  (Write Model) │ │  (Search Index)│ │  (AI Tables)   │           │
│  └────────────────┘ └────────────────┘ └────────────────┘           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Module Structure

```
async/
├── config/
│   ├── RedisConfig.java                  # Redis connection & template configuration
│   └── RedisStreamConfig.java            # Stream consumer groups, listeners, error handling
├── consumer/
│   ├── MediaAiInsightsConsumer.java       # Processes ML insights results
│   ├── FaceDetectionConsumer.java         # Processes face detection results
│   ├── FaceRecognitionConsumer.java       # Processes face recognition results
│   ├── HashtagUsageSyncConsumer.java      # Syncs hashtag usage counts
│   └── PostInsightsEnrichedConsumer.java  # Processes aggregated post insights
├── dto/
│   ├── FaceDetectionResultDTO.java        # Face detection result payload
│   ├── FaceRecognitionResultDTO.java      # Face recognition result payload
│   ├── MediaAiInsightsResultDTO.java      # ML insights result payload
│   ├── NotificationEventDTO.java          # Notification event payload
│   ├── PostImageEventDTO.java             # Post image processing event
│   ├── PostInsightsEnrichedDTO.java       # Aggregated post insights payload
│   └── ProfilePictureEventDTO.java        # Profile picture processing event
├── exception/
│   ├── AsyncExceptionHandler.java         # Global async exception handler
│   └── async/
│       ├── BboxParsingException.java
│       ├── MediaAiInsightsNotFoundException.java
│       ├── MediaDetectedFaceNotFoundException.java
│       ├── PostMediaNotFoundException.java
│       ├── StreamDeserializationException.java
│       ├── StreamMessageProcessingException.java
│       └── StreamPublishException.java
├── mapper/
│   └── AsyncMapper.java                   # DTO-Entity mapping for async results
├── service/
│   ├── ElasticsearchSyncTriggerService.java  # Triggers ES index sync via Redis
│   ├── PostAggregationTriggerService.java    # Triggers post-level AI aggregation
│   ├── PostProcessingStatusService.java      # Checks if all media are AI-processed
│   ├── ReadModelUpdateService.java           # Updates read model tables
│   └── RedisStreamPublisher.java             # Publishes events to Redis Streams
└── streaming/
    ├── ConsumerStreamConstants.java       # Inbound stream name constants
    ├── ProducerStreamConstants.java       # Outbound stream name constants
    └── StreamingConfigConstants.java      # Consumer group/name constants
```

## Redis Stream Configuration

### RedisStreamConfig

The central configuration class that:

1. **Creates consumer groups** for all 11 streams on startup
2. **Registers all consumers** with unique instance-based names
3. **Configures the listener container** with optimized settings

```
Configuration Details:
├── Batch Size:     50 messages per poll
├── Poll Timeout:   2 seconds (long polling to reduce CPU)
├── Consumer Group: "backend-group" (shared across all streams)
├── Consumer Name:  "{appName}-{uuid8}-{ConsumerClassName}"
├── Read Offset:    ">" (new messages only, never-delivered)
└── Error Handler:  Custom with NOGROUP auto-recovery
```

### Consumer Group Initialization

The config ensures consumer groups exist with a 3-step strategy:
1. Check if stream exists, create with initial message if not
2. Create consumer group with `0-0` offset
3. Handle `BUSYGROUP` errors gracefully (group already exists)

### Error Handler

The custom error handler provides:
- **NOGROUP auto-recovery**: If a consumer group is missing at runtime, it's automatically recreated
- **Stream name extraction** from error messages for targeted recovery
- **PEL management**: Failed messages remain in the Pending Entries List for retry

## Stream Constants

### Inbound Streams (ConsumerStreamConstants)

| Constant                          | Stream Name                           | Source         |
|-----------------------------------|---------------------------------------|----------------|
| `ML_INSIGHTS_STREAM`             | `ml-insights-results`                 | ML Service     |
| `FACE_DETECTION_STREAM`          | `face-detection-results`              | ML Service     |
| `FACE_RECOGNITION_STREAM`        | `face-recognition-results`            | ML Service     |
| `USER_PROFILE_FACE_EMBEDDING_STREAM` | `user-profile-face-embedding-results` | ML Service |
| `POST_INSIGHTS_ENRICHED_STREAM`  | `post-insights-enriched`              | AI Aggregator  |

### Outbound Streams (ProducerStreamConstants)

| Constant                              | Stream Name                   | Destination     |
|---------------------------------------|-------------------------------|-----------------|
| `PROFILE_PICTURE_PROCESSING_STREAM`  | `profile-picture-processing`  | ML Service      |
| `POST_IMAGE_PROCESSING_STREAM`       | `post-image-processing`       | ML Service      |
| `POST_UPDATE_STREAM`                 | `post-update-processing`      | ML Service      |
| `POST_INTERACTION_SYNC_STREAM`       | `post-interaction-sync`       | Self (Backend)  |
| `BLOG_INTERACTION_SYNC_STREAM`       | `blog-interaction-sync`       | Self (Backend)  |
| `USER_PROFILE_POST_SYNC_STREAM`      | `user-profile-post-sync`      | Self (Backend)  |
| `USER_PROFILE_BLOG_SYNC_STREAM`      | `user-profile-blog-sync`      | Self (Backend)  |
| `HASHTAG_USAGE_SYNC_STREAM`          | `hashtag-usage-sync-stream`   | Self (Backend)  |
| `NOTIFICATION_EVENTS_STREAM`         | `notification-events`         | Self (Backend)  |
| `POST_AGGREGATION_TRIGGER_STREAM`    | `post-aggregation-trigger`    | AI Aggregator   |
| `ES_SYNC_QUEUE_STREAM`              | `es-sync-queue`               | AI ES Sync Svc  |

### Consumer Config (StreamingConfigConstants)

| Constant                             | Value                                  |
|--------------------------------------|----------------------------------------|
| `BACKEND_CONSUMER_GROUP`            | `backend-group`                        |
| `MEDIA_AI_CONSUMER`                 | `media-ai-consumer`                    |
| `FACE_DETECTION_CONSUMER`           | `face-detection-consumer`              |
| `FACE_RECOGNITION_CONSUMER`         | `face-recognition-consumer`            |
| `POST_INTERACTION_SYNC_CONSUMER`    | `post-interaction-sync-consumer`       |
| `USER_PROFILE_POST_SYNC_CONSUMER`   | `user-profile-post-sync-consumer`      |
| `USER_PROFILE_FACE_EMBEDDING_CONSUMER` | `user-profile-face-embedding-consumer` |
| `NOTIFICATION_CONSUMER`             | `notification-consumer`                |

## Consumers

### 1. MediaAiInsightsConsumer
**Stream:** `ml-insights-results`  
**Purpose:** Processes AI analysis results (captions, tags, scenes, safety, embeddings) for post media.

**Processing Flow:**
1. Deserialize `MediaAiInsightsResultDTO` from stream record
2. Find corresponding `PostMedia` entity (skip if deleted)
3. Create or merge `MediaAiInsights` entity in PostgreSQL
4. Index to Elasticsearch `SearchAssetDocument`
5. Update `read_model_media_search` via `ReadModelUpdateService`
6. Trigger ES sync via `ElasticsearchSyncTriggerService`
7. Check if **all** media for the post are processed (`PostProcessingStatusService`)
8. If all done → trigger `PostAggregationTriggerService`

### 2. FaceDetectionConsumer
**Stream:** `face-detection-results`  
**Purpose:** Processes detected faces in post media images.

**Processing Flow:**
1. Deserialize `FaceDetectionResultDTO` with face bounding boxes and embeddings
2. Find `MediaAiInsights` with **exponential backoff retry** (up to 5 attempts)
3. Save each `MediaDetectedFace` entity with vector embedding via raw JDBC
4. Update `read_model_face_search` via `ReadModelUpdateService`
5. Trigger ES sync for each face

### 3. FaceRecognitionConsumer
**Stream:** `face-recognition-results`  
**Purpose:** Matches detected faces to known users.

**Processing Flow:**
1. Deserialize `FaceRecognitionResultDTO` (faceId, suggestedUserId, confidence)
2. Find `MediaDetectedFace` entity
3. Update with recognized user and confidence score
4. Update `read_model_face_search` with identified user info
5. Update `read_model_media_search` with detected user IDs/usernames
6. Trigger ES sync

### 4. HashtagUsageSyncConsumer
**Stream:** `hashtag-usage-sync-stream`  
**Purpose:** Asynchronously updates hashtag usage counts in PostgreSQL.

**Processing Flow:**
1. Extract `hashtagName` and `change` (increment/decrement)
2. Execute `hashtagRepository.updateUsageCount(hashtagName, change)`
3. Flush and clear EntityManager for immediate execution

### 5. PostInsightsEnrichedConsumer
**Stream:** `post-insights-enriched`  
**Purpose:** Processes aggregated AI insights for an entire post after all media are processed.

**Processing Flow:**
1. Deserialize `PostInsightsEnrichedDTO` with post-level aggregated data
2. Fetch `Post` entity for author information
3. Create/update `read_model_post_search` with aggregated tags, scenes, event type, categories
4. Back-fill `read_model_media_search` entries with `postAllTags`
5. Trigger ES sync for both post and media read models

## Services

### RedisStreamPublisher
Publishes events to Redis Streams with:
- JSON serialization via Jackson
- Correlation ID propagation from MDC
- Critical stream designation for guaranteed delivery
- Error handling with `StreamPublishException`

### ReadModelUpdateService
Updates the AI read model PostgreSQL tables:
- `updateMediaSearchReadModel()` → `read_model_media_search`
- `createFaceSearchReadModel()` → `read_model_face_search`
- Uses `@Transactional(propagation = Propagation.REQUIRES_NEW)` for independent commits

### PostProcessingStatusService
Checks if all media for a given post have completed AI processing:
- Compares total media count with `MediaAiStatus.COMPLETED` count
- Used by `MediaAiInsightsConsumer` to decide when to trigger post aggregation

### PostAggregationTriggerService
Publishes to `post-aggregation-trigger` stream when all media are ready:
- Sends `postId`, `totalMedia`, `allMediaIds` (comma-separated)
- Includes correlation ID for end-to-end tracing

### ElasticsearchSyncTriggerService
Publishes to `es-sync-queue` to notify AI ES Sync Service of read model updates:
- Maps table names to short index types (e.g., `read_model_media_search` → `media_search`)
- Supports `INDEX` and `DELETE` operations
- Sends `indexType`, `operation`, `documentId`, `timestamp`, `correlationId`

## DTOs

| DTO                          | Fields                                                        |
|------------------------------|---------------------------------------------------------------|
| `MediaAiInsightsResultDTO`   | mediaId, caption, tags, scenes, isSafe, imageEmbedding, etc.  |
| `FaceDetectionResultDTO`     | mediaId, facesDetected, faces (bbox, embedding, confidence)   |
| `FaceRecognitionResultDTO`   | faceId, suggestedUserId, confidenceScore                      |
| `PostInsightsEnrichedDTO`    | postId, allAiTags, allAiScenes, inferredEventType, categories |
| `PostImageEventDTO`          | postId, mediaId, mediaUrl, userId                             |
| `ProfilePictureEventDTO`     | userId, imageUrl                                              |
| `NotificationEventDTO`       | type, actorId, recipientId, contentId, contentType            |

## Error Handling

### Exception Hierarchy
- `StreamDeserializationException` - Failed to parse stream message
- `StreamMessageProcessingException` - General processing failure
- `StreamPublishException` - Failed to publish to stream
- `BboxParsingException` - Failed to parse face bounding box coordinates
- `MediaAiInsightsNotFoundException` - Referenced AI insights record not found
- `MediaDetectedFaceNotFoundException` - Referenced face record not found
- `PostMediaNotFoundException` - Referenced post media not found

### Retry Strategy
- **FaceDetectionConsumer**: Exponential backoff retry (5 attempts, 100ms initial delay) when `MediaAiInsights` not yet created by concurrent `MediaAiInsightsConsumer`
- **PEL Management**: Failed messages are **not acknowledged** (exceptions re-thrown) to remain in Redis Pending Entries List for reprocessing

## Cross-Module Consumers

While the `async/` module houses the core ML consumers, several modules have their own domain-specific consumers registered in `RedisStreamConfig`:

| Consumer                           | Module          | Stream                           | Purpose                                     |
|------------------------------------|-----------------|----------------------------------|---------------------------------------------|
| `PostInteractionSyncConsumer`     | `posts/`        | `post-interaction-sync`          | Sync reaction/comment counts to ES          |
| `BlogInteractionSyncConsumer`     | `blogs/`        | `blog-interaction-sync`          | Sync reaction/comment counts to ES          |
| `UserProfilePostSyncConsumer`     | `posts/`        | `user-profile-post-sync`         | Sync author profile changes to post ES docs |
| `UserProfileBlogSyncConsumer`     | `blogs/`        | `user-profile-blog-sync`         | Sync author profile changes to blog ES docs |
| `UserProfileFaceEmbeddingConsumer`| `users/`        | `user-profile-face-embedding-results` | Sync face embeddings to user ES docs   |
| `NotificationConsumer`            | `notifications/`| `notification-events`            | Process and deliver notifications           |

All consumers are wired together in `RedisStreamConfig.streamMessageListenerContainer()`.

