# Kaleidoscope Read Models System Documentation

## Overview

The Read Models System (`readmodels/` module) provides denormalized, pre-computed PostgreSQL tables optimized for AI-powered search and Elasticsearch indexing. These tables serve as the bridge between raw AI/ML processing results and the Elasticsearch search indices, enabling fast full-text search, face recognition, content recommendations, and personalized feeds.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Structure](#module-structure)
3. [Read Model Tables](#read-model-tables)
4. [Data Flow](#data-flow)
5. [Elasticsearch Sync Pipeline](#elasticsearch-sync-pipeline)
6. [Read Model Descriptions](#read-model-descriptions)
7. [Best Practices](#best-practices)

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        READ MODELS SYSTEM                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Async Consumers (Redis Stream)                   │   │
│  │  • MediaAiInsightsConsumer → MediaSearchReadModel            │   │
│  │  • FaceDetectionConsumer → FaceSearchReadModel               │   │
│  │  • FaceRecognitionConsumer → FaceSearch + MediaSearch        │   │
│  │  • PostInsightsEnrichedConsumer → PostSearch + MediaSearch   │   │
│  │  • UserProfileFaceEmbeddingConsumer → KnownFacesReadModel   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │            ReadModelUpdateService (Centralized)               │   │
│  │  • updateMediaSearchReadModel(insights, postMedia)           │   │
│  │  • createFaceSearchReadModel(detectedFace)                   │   │
│  │  • Uses REQUIRES_NEW transaction propagation                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Read Model Tables                     │   │
│  │                                                               │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐   │   │
│  │  │ read_model_media_   │  │ read_model_post_search      │   │   │
│  │  │ search              │  │ (aggregated post insights)   │   │   │
│  │  └─────────────────────┘  └─────────────────────────────┘   │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐   │   │
│  │  │ read_model_face_    │  │ read_model_known_faces      │   │   │
│  │  │ search              │  │ (user face enrollments)      │   │   │
│  │  └─────────────────────┘  └─────────────────────────────┘   │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐   │   │
│  │  │ read_model_user_    │  │ read_model_feed_             │   │   │
│  │  │ search              │  │ personalized                 │   │   │
│  │  └─────────────────────┘  └─────────────────────────────┘   │   │
│  │  ┌─────────────────────┐                                    │   │
│  │  │ read_model_         │                                    │   │
│  │  │ recommendations_knn │                                    │   │
│  │  └─────────────────────┘                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         ElasticsearchSyncTriggerService                       │   │
│  │  Publishes to "es-sync-queue" Redis Stream                   │   │
│  │  → AI ES Sync Service indexes to Elasticsearch               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Module Structure

```
readmodels/
├── model/
│   ├── FaceSearchReadModel.java              # Detected faces with embeddings
│   ├── FeedPersonalizedReadModel.java        # Personalized feed items
│   ├── KnownFacesReadModel.java              # Enrolled user face profiles
│   ├── MediaSearchReadModel.java             # AI-enriched media search data
│   ├── PostSearchReadModel.java              # Aggregated post search data
│   ├── RecommendationsKnnReadModel.java      # KNN recommendation vectors
│   └── UserSearchReadModel.java              # User search/discovery data
└── repository/
    ├── FaceSearchReadModelRepository.java
    ├── FeedPersonalizedReadModelRepository.java
    ├── KnownFacesReadModelRepository.java
    ├── MediaSearchReadModelRepository.java
    ├── PostSearchReadModelRepository.java
    ├── RecommendationsKnnReadModelRepository.java
    └── UserSearchReadModelRepository.java
```

## Read Model Tables

### Summary Table

| Read Model Table               | Primary Key   | Purpose                                    | Updated By                          |
|-------------------------------|---------------|--------------------------------------------|------------------------------------|
| `read_model_media_search`     | `media_id`    | Per-media AI insights for search           | MediaAiInsightsConsumer, PostInsightsEnrichedConsumer |
| `read_model_post_search`      | `post_id`     | Aggregated post-level search data          | PostInsightsEnrichedConsumer       |
| `read_model_face_search`      | `id` (auto)   | Detected faces with vector embeddings      | FaceDetectionConsumer, FaceRecognitionConsumer |
| `read_model_known_faces`      | `user_id`     | User face enrollment profiles              | AI Service (external)              |
| `read_model_user_search`      | `user_id`     | User profile data for discovery            | AI Service (external)              |
| `read_model_feed_personalized`| `id` (auto)   | Pre-computed personalized feed items       | AI Service (external)              |
| `read_model_recommendations_knn` | `media_id` | Image embedding vectors for KNN search     | AI Service (external)              |

## Data Flow

```
┌─────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────────┐
│ ML Svc  │───▶│  Redis   │───▶│  Async       │───▶│  Read Model  │───▶│ ES Sync Queue │
│ Results │    │  Stream  │    │  Consumer    │    │  PostgreSQL  │    │ (Redis Stream)│
└─────────┘    └──────────┘    └──────────────┘    └──────────────┘    └───────────────┘
                                                                              │
                                                                              ▼
                                                                     ┌───────────────┐
                                                                     │ AI ES Sync    │
                                                                     │ Service       │
                                                                     │ → Elasticsearch│
                                                                     └───────────────┘
```

## Elasticsearch Sync Pipeline

After any read model table is updated, the `ElasticsearchSyncTriggerService` publishes a sync event:

| Table Name                      | Index Type        |
|--------------------------------|-------------------|
| `read_model_media_search`      | `media_search`    |
| `read_model_post_search`       | `post_search`     |
| `read_model_user_search`       | `user_search`     |
| `read_model_face_search`       | `face_search`     |

The AI ES Sync Service (external Python service) reads from the `es-sync-queue` stream, fetches the updated row from the read model table, and indexes it into Elasticsearch.

## Read Model Descriptions

### 1. MediaSearchReadModel (`read_model_media_search`)

Stores per-media AI analysis results for full-text and semantic search.

| Column              | Type    | Description                                    |
|---------------------|---------|------------------------------------------------|
| `media_id`          | Long    | **PK** - PostMedia foreign key                 |
| `post_id`           | Long    | Parent post ID                                 |
| `post_title`        | String  | Post title (denormalized)                      |
| `post_all_tags`     | TEXT    | Comma-separated hashtags/tags from all media   |
| `media_url`         | String  | Cloudinary media URL                           |
| `ai_caption`        | TEXT    | AI-generated image caption                     |
| `ai_tags`           | TEXT    | Comma-separated AI tags                        |
| `ai_scenes`         | TEXT    | Comma-separated scene classifications          |
| `image_embedding`   | TEXT    | 512-dim vector as JSON string                  |
| `is_safe`           | Boolean | Content safety flag                            |
| `detected_user_ids` | TEXT    | Comma-separated recognized user IDs            |
| `detected_usernames`| TEXT    | Comma-separated recognized usernames           |
| `uploader_id`       | Long    | Post author user ID                            |
| `uploader_username` | String  | Post author username                           |
| `created_at`        | Instant | Record creation timestamp                      |

### 2. PostSearchReadModel (`read_model_post_search`)

Stores aggregated post-level data combining insights from all media.

| Column                | Type    | Description                                    |
|-----------------------|---------|------------------------------------------------|
| `post_id`             | Long    | **PK** - Post ID                               |
| `author_id`           | Long    | Post author user ID                            |
| `author_username`     | String  | Post author username                           |
| `author_department`   | String  | Author's department                            |
| `title`               | String  | Post title                                     |
| `body`                | TEXT    | Post content body                              |
| `all_ai_tags`         | TEXT    | Comma-separated aggregated AI tags             |
| `all_ai_scenes`       | TEXT    | Comma-separated aggregated scenes              |
| `all_detected_user_ids` | TEXT  | Comma-separated all detected user IDs          |
| `inferred_event_type` | String  | AI-inferred event type                         |
| `inferred_tags`       | TEXT    | AI-inferred tags                               |
| `categories`          | TEXT    | Comma-separated content categories             |
| `total_reactions`     | Integer | Reaction count                                 |
| `created_at`          | Instant | Post creation timestamp                        |

### 3. FaceSearchReadModel (`read_model_face_search`)

Stores individual detected faces with vector embeddings for face search.

| Column                | Type    | Description                                    |
|-----------------------|---------|------------------------------------------------|
| `id`                  | Long    | **PK** - Auto-generated                        |
| `face_id`             | String  | Unique face identifier                         |
| `media_id`            | Long    | Source media ID                                |
| `post_id`             | Long    | Source post ID                                 |
| `face_embedding`      | TEXT    | 1024-dim face vector as JSON string            |
| `bbox`                | TEXT    | Bounding box `[x,y,w,h]` as JSON              |
| `identified_user_id`  | Long    | Recognized user ID (null if unknown)           |
| `identified_username` | String  | Recognized username (null if unknown)          |
| `match_confidence`    | Float   | Face recognition confidence score              |
| `created_at`          | Instant | Detection timestamp                            |

### 4. KnownFacesReadModel (`read_model_known_faces`)

Enrolled user face profiles for face recognition matching.

| Column              | Type    | Description                                    |
|---------------------|---------|------------------------------------------------|
| `user_id`           | Long    | **PK** - User ID                               |
| `username`           | String  | Username (unique)                              |
| `department`         | String  | User's department                              |
| `profile_pic_url`    | String  | Profile picture URL                            |
| `face_embedding`     | TEXT    | 1024-dim face vector as JSON string            |
| `enrolled_at`        | Instant | Face enrollment timestamp                      |
| `is_active`          | Boolean | Whether enrollment is active                   |

### 5. UserSearchReadModel (`read_model_user_search`)

User profile data for user discovery and search.

| Column              | Type    | Description                                    |
|---------------------|---------|------------------------------------------------|
| `user_id`           | Long    | **PK** - User ID                               |
| `username`           | String  | Username                                       |
| `full_name`          | String  | Full display name                              |
| `department`         | String  | Department                                     |
| `bio`                | TEXT    | User biography                                 |
| `total_posts`        | Integer | Total post count                               |
| `total_followers`    | Integer | Follower count                                 |
| `face_enrolled`      | Boolean | Whether face is enrolled                       |
| `joined_at`          | Instant | Account creation timestamp                     |
| `updated_at`         | Instant | Last update timestamp                          |

### 6. FeedPersonalizedReadModel (`read_model_feed_personalized`)

Pre-computed personalized feed items for fast feed rendering.

| Column              | Type    | Description                                    |
|---------------------|---------|------------------------------------------------|
| `id`                | Long    | **PK** - Auto-generated                        |
| `feed_item_id`       | String  | Unique feed item identifier                    |
| `target_user_id`     | Long    | User this feed item is for                     |
| `media_id`           | Long    | Media asset ID                                 |
| `media_url`          | String  | Media URL                                      |
| `caption`            | TEXT    | Media caption                                  |
| `uploader_id`        | Long    | Content author user ID                         |
| `uploader_username`  | String  | Content author username                        |
| `combined_score`     | Float   | Personalization relevance score                |
| `created_at`         | Instant | Feed item creation timestamp                   |
| `expires_at`         | Instant | Feed item expiry timestamp                     |

### 7. RecommendationsKnnReadModel (`read_model_recommendations_knn`)

Image embedding vectors for K-Nearest Neighbors content recommendations.

| Column              | Type    | Description                                    |
|---------------------|---------|------------------------------------------------|
| `media_id`          | Long    | **PK** - Media ID                              |
| `image_embedding`    | TEXT    | 512-dim image vector as JSON string            |
| `media_url`          | String  | Media URL                                      |
| `caption`            | TEXT    | Media caption                                  |
| `is_safe`            | Boolean | Content safety flag                            |
| `created_at`         | Instant | Record creation timestamp                      |

## Best Practices

1. **Denormalization is intentional** - Read models duplicate data from write models for query performance
2. **Eventual consistency** - Read models are updated asynchronously; slight lag is expected
3. **Independent transactions** - Use `@Transactional(propagation = Propagation.REQUIRES_NEW)` to avoid cascading failures
4. **Always trigger ES sync** - After any read model update, call `ElasticsearchSyncTriggerService.triggerSync()`
5. **Comma-separated strings** - Multi-value fields (tags, scenes, user IDs) use comma-separated TEXT columns for simplicity
6. **Vector embeddings as JSON** - Face (1024-dim) and image (512-dim) embeddings are stored as JSON strings
7. **External updates** - Some read models (`known_faces`, `user_search`, `feed_personalized`, `recommendations_knn`) are primarily updated by the external AI service

