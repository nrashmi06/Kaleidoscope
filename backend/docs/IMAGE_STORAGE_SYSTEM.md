# Kaleidoscope Image Storage & Media Management System Documentation
## Overview
The Image Storage System in Kaleidoscope provides a comprehensive solution for managing media assets throughout their lifecycle. It integrates with Cloudinary for cloud-based storage, implements secure upload workflows, tracks all media assets, and automatically cleans up orphaned files to optimize storage costs.
## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Cloudinary Integration](#cloudinary-integration)
3. [Upload Signature Generation](#upload-signature-generation)
4. [Media Asset Tracking](#media-asset-tracking)
5. [Upload Workflow](#upload-workflow)
6. [Media Validation](#media-validation)
7. [Automatic Cleanup](#automatic-cleanup)
8. [API Endpoints](#api-endpoints)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)
## Architecture Overview
### System Components
```
┌─────────────────────────────────────────────────────────────────────┐
│                   IMAGE STORAGE & MEDIA MANAGEMENT                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Frontend Application                       │   │
│  │              (Request upload signature)                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                ImageStorageService                            │   │
│  │          (Generate signed upload URLs)                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              MediaAssetTrackerRepository                      │   │
│  │         (Track uploads with PENDING status)                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Frontend → Cloudinary                            │   │
│  │         (Direct upload with signed URL)                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Frontend → Backend                                  │   │
│  │      (Create/Update Blog/Post with media URLs)               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Media Validation & Association                   │   │
│  │        (Update tracker to ASSOCIATED status)                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         MediaAssetCleanupScheduler                            │   │
│  │     (Hourly cleanup of orphaned/old media)                    │   │
│  │  - PENDING assets older than 60 min                          │   │
│  │  - MARKED_FOR_DELETE assets                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```
### Key Technologies
- **Cloudinary**: Cloud-based media storage and transformation
- **Spring Async**: Asynchronous upload/delete operations
- **Spring Scheduling**: Automatic cleanup of orphaned media
- **JWT**: User authentication for upload signatures
- **PostgreSQL**: Media asset tracking database
## Cloudinary Integration
### Configuration
**CloudinaryConfig.java**:
```java
@Configuration
public class CloudinaryConfig {
    @Value("${cloudinary.cloud-name}")
    private String cloudName;
    @Value("${cloudinary.api-key}")
    private String apiKey;
    @Value("${cloudinary.api-secret}")
    private String apiSecret;
    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret
        ));
    }
}
```
**application.yml**:
```yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME:test-cloud}
  api-key: ${CLOUDINARY_API_KEY:test-api-key}
  api-secret: ${CLOUDINARY_API_SECRET:test-api-secret}
  url: ${CLOUDINARY_URL:cloudinary://test-api-key:test-api-secret@test-cloud}
```
### Folder Structure
Cloudinary assets are organized by content type:
```
kaleidoscope/
├── users/
│   ├── profiles/{userId}/
│   │   └── profile-image.jpg
│   └── covers/{userId}/
│       └── cover-photo.jpg
├── posts/
│   └── {unique-id}.jpg
├── blogs/
│   └── {unique-id}.jpg
└── categories/
    └── {categoryId}/
        └── category-image.jpg
```
### Upload Parameters
**Standard Upload Options**:
```java
Map<String, Object> uploadParams = ObjectUtils.asMap(
    "folder", "kaleidoscope/" + folderPath,
    "resource_type", "image",
    "format", "jpg",
    "quality", "auto",
    "fetch_format", "auto"
);
```
**Benefits**:
- **Auto Format**: Serves WebP to supported browsers
- **Auto Quality**: Optimizes file size vs. quality
- **Organized Structure**: Easy to manage and debug
## Upload Signature Generation
### Why Signed Uploads?
**Security Benefits**:
1. Backend validates user authentication
2. Frontend cannot upload without permission
3. Prevents unauthorized uploads to your Cloudinary account
4. Controls upload parameters (folder, transformations)
### Signature Generation Process
**Request**:
```
POST /api/image-storage/generate-signature
Authorization: Bearer {jwt-token}
Content-Type: application/json
{
  "contentType": "POST",
  "fileNames": ["image1.jpg", "image2.png"]
}
```
**Process**:
1. Extract user ID from JWT token
2. Validate user exists in database
3. Determine folder based on content type
4. Generate unique public IDs for each file
5. Create upload signatures using Cloudinary API
6. Create MediaAssetTracker records with `PENDING` status
7. Return signatures and upload URLs
**Response**:
```json
{
  "success": true,
  "data": {
    "signatures": [
      {
        "signature": "a9b8c7d6e5f4...",
        "timestamp": 1729425000,
        "publicId": "kaleidoscope/posts/uuid-123",
        "uploadUrl": "https://api.cloudinary.com/v1_1/{cloud}/image/upload",
        "apiKey": "your-api-key",
        "folder": "kaleidoscope/posts"
      }
    ]
  }
}
```
## Media Asset Tracking
### MediaAssetTracker Model
```java
@Entity
@Table(name = "media_asset_tracker")
public class MediaAssetTracker {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String publicId;           // Cloudinary public_id
    @Column(nullable = false)
    private Long userId;               // User who uploaded
    @Column(length = 50)
    private String contentType;        // BLOG, POST, etc.
    private Long contentId;            // ID of blog/post
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaAssetStatus status;   // PENDING, ASSOCIATED, MARKED_FOR_DELETE
    @Column(nullable = false)
    private LocalDateTime uploadedAt;
    private LocalDateTime associatedAt;
}
```
### Status Lifecycle
```
┌─────────────┐
│   PENDING   │ ← Signature generated, upload allowed
└─────────────┘
       │
       │ User uploads to Cloudinary
       │ User creates/updates blog/post with URL
       │
       ▼
┌─────────────┐
│ ASSOCIATED  │ ← Linked to blog/post content
└─────────────┘
       │
       │ User deletes blog/post
       │
       ▼
┌─────────────────────┐
│ MARKED_FOR_DELETE   │ ← Queued for cleanup
└─────────────────────┘
       │
       │ Cleanup scheduler runs (hourly)
       │
       ▼
   [DELETED]
```
## Upload Workflow
### Complete Frontend-to-Backend Flow
**Step 1: Request Upload Signature**
```javascript
async function requestUploadSignatures(files) {
  const fileNames = files.map(f => f.name);
  const response = await fetch('/api/image-storage/generate-signature', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contentType: 'POST',
      fileNames: fileNames
    })
  });
  const data = await response.json();
  return data.data.signatures;
}
```
**Step 2: Upload to Cloudinary**
```javascript
async function uploadToCloudinary(file, signature) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', signature.signature);
  formData.append('timestamp', signature.timestamp);
  formData.append('public_id', signature.publicId);
  formData.append('api_key', signature.apiKey);
  formData.append('folder', signature.folder);
  const response = await fetch(signature.uploadUrl, {
    method: 'POST',
    body: formData
  });
  const result = await response.json();
  return result.secure_url;
}
```
**Step 3: Create Content with Media URLs**
```javascript
async function createPost(postData, mediaUrls) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: postData.title,
      body: postData.body,
      categoryIds: postData.categoryIds,
      mediaDetails: mediaUrls.map((url, index) => ({
        mediaUrl: url,
        altText: `Image ${index + 1}`,
        displayOrder: index
      }))
    })
  });
  return await response.json();
}
```
## Automatic Cleanup
### MediaAssetCleanupScheduler
**Purpose**: Automatically delete orphaned and marked media to save storage costs
**Schedule**: Runs every hour
**Implementation**:
```java
@Component
@RequiredArgsConstructor
public class MediaAssetCleanupScheduler {
    private final MediaAssetTrackerRepository trackerRepository;
    private final ImageStorageService imageStorageService;
    @Scheduled(fixedRate = 60 * 60 * 1000) // 1 hour
    @Transactional
    public void cleanupOrphanedMediaAssets() {
        log.info("Starting orphaned media asset cleanup job...");
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(60);
        List<MediaAssetTracker> orphans = trackerRepository.findOrphanedAssets(
            MediaAssetStatus.MARKED_FOR_DELETE,
            MediaAssetStatus.PENDING,
            cutoff
        );
        if (orphans.isEmpty()) {
            log.info("No orphaned media assets found.");
            return;
        }
        log.info("Found {} orphaned media assets to clean up.", orphans.size());
        for (MediaAssetTracker tracker : orphans) {
            try {
                imageStorageService.deleteImageByPublicId(tracker.getPublicId());
                trackerRepository.delete(tracker);
                log.info("Cleaned up media asset: {}", tracker.getPublicId());
            } catch (Exception e) {
                log.error("Failed to clean up media asset {}: {}", 
                    tracker.getPublicId(), e.getMessage());
            }
        }
        log.info("Cleanup job finished.");
    }
}
```
**Cleanup Criteria**:
1. **MARKED_FOR_DELETE**: Any age (deleted immediately)
2. **PENDING**: Older than 60 minutes (user abandoned upload)
## Best Practices
### 1. Signature Generation
✅ **Always authenticate** before generating signatures  
✅ **Validate file count** to prevent abuse  
✅ **Use unique public IDs** (UUID) for each upload  
✅ **Track all signatures** in MediaAssetTracker  
✅ **Set appropriate folder** based on content type
### 2. Frontend Upload
✅ **Upload directly to Cloudinary** (not through backend)  
✅ **Handle upload errors gracefully**  
✅ **Show upload progress** to users  
✅ **Validate file types** before upload  
✅ **Limit file sizes** (e.g., 10MB max)
### 3. Media Association
✅ **Validate URLs** before accepting  
✅ **Check tracker status** is PENDING  
✅ **Update status atomically** with content creation  
✅ **Handle association failures** properly
### 4. Cleanup Strategy
✅ **Mark for deletion** instead of immediate delete  
✅ **Let scheduler handle cleanup** asynchronously  
✅ **Log all cleanup operations** for audit  
✅ **Handle cleanup failures** gracefully  
✅ **Monitor orphaned asset count**
## Troubleshooting
### Issue 1: "Media asset not tracked"
**Cause**: Signature not generated before upload
**Solution**:
1. Always call generate-signature first
2. Check MediaAssetTracker record exists
3. Verify public_id matches between signature and URL
### Issue 2: Orphaned media accumulating
**Cause**: Scheduler not running or failing
**Solution**:
1. Check scheduler logs for errors
2. Verify `@EnableScheduling` in config
3. Monitor cleanup job execution
4. Check Cloudinary API limits
## Conclusion
The Kaleidoscope Image Storage & Media Management System provides a complete solution for handling user-uploaded media:
✅ **Secure Uploads**: Signed URLs prevent unauthorized access  
✅ **Asset Tracking**: Every upload tracked from creation to deletion  
✅ **Automatic Cleanup**: Hourly job removes orphaned media  
✅ **Cost Optimization**: Prevents storage bloat from abandoned uploads  
✅ **Direct Uploads**: Frontend uploads to Cloudinary, reducing backend load  
✅ **Validation**: URLs validated before association with content  
✅ **Async Operations**: Non-blocking upload/delete operations  
✅ **Audit Trail**: Complete logging of all media operations
