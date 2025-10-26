# Kaleidoscope Blog System Documentation

## Overview

The Blog System in Kaleidoscope provides a comprehensive content publishing platform with approval workflows, media management, categorization, and soft deletion capabilities. It allows users to create long-form content with rich media, while admins can review and approve submissions before publication.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Blog Model](#blog-model)
3. [Blog Status Workflow](#blog-status-workflow)
4. [Blog Operations](#blog-operations)
5. [Media Management](#media-management)
6. [Category System](#category-system)
7. [Filtering & Search](#filtering--search)
8. [API Endpoints](#api-endpoints)
9. [Soft Deletion](#soft-deletion)
10. [Best Practices](#best-practices)

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BLOG SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                       User Request                            │   │
│  │            (Create/Update/Delete Blog)                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    BlogController                             │   │
│  │              (Authentication & Validation)                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     BlogService                               │   │
│  │  - Authorization checks                                       │   │
│  │  - Media validation                                           │   │
│  │  - Category validation                                        │   │
│  │  - Status workflow management                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  PostgreSQL Database                          │   │
│  │                                                               │   │
│  │  Tables:                                                      │   │
│  │  - blogs                  - blog_media                       │   │
│  │  - blog_categories        - blog_tags                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              MediaAssetTracker Integration                    │   │
│  │         (Track Cloudinary uploads & cleanup)                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Technologies

- **PostgreSQL**: Relational database for blog storage
- **JPA/Hibernate**: ORM for database operations
- **Cloudinary**: Cloud-based media storage
- **Spring Security**: Authorization and access control
- **Soft Delete**: Non-destructive deletion with `@SQLDelete` and `@Where`

## Blog Model

### Blog Entity

```java
@Entity
@Table(name = "blogs")
@SQLDelete(sql = "UPDATE blogs SET deleted_at = NOW() WHERE blog_id = ?")
@Where(clause = "deleted_at IS NULL")
public class Blog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long blogId;
    
    @ManyToOne
    private User user;                    // Blog author
    
    @ManyToOne
    private User reviewer;                // Admin who reviewed
    
    private String title;                 // Max 200 chars
    private String body;                  // Full text content
    private String summary;               // Brief description
    private Integer wordCount;            // Auto-calculated
    private Integer readTimeMinutes;      // Auto-calculated (250 words/min)
    
    @ManyToOne
    private Location location;
    
    @Enumerated(EnumType.STRING)
    private BlogStatus blogStatus;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    private LocalDateTime reviewedAt;
    private LocalDateTime deletedAt;      // Soft delete timestamp
    
    @OneToMany(mappedBy = "blog", cascade = CascadeType.ALL)
    private Set<BlogMedia> media;
    
    @OneToMany(mappedBy = "blog", cascade = CascadeType.ALL)
    private Set<BlogCategory> categories;
    
    @OneToMany(mappedBy = "taggingBlog", cascade = CascadeType.ALL)
    private Set<BlogTag> taggedBlogs;
}
```

### Field Details

**Title**: 
- Max length: 200 characters
- Required field
- Used in summaries and search

**Body**:
- Text field (unlimited length)
- Full blog content
- HTML can be stored

**Summary**:
- Brief description/excerpt
- Used in list views
- Optional field

**Word Count & Read Time**:
- Auto-calculated in `@PrePersist` and `@PreUpdate`
- Word count: Split body by whitespace
- Read time: Based on 250 words per minute average reading speed

**Status**:
- Controlled by `BlogStatus` enum
- See [Blog Status Workflow](#blog-status-workflow)

## Blog Status Workflow

### Status Enum

```java
public enum BlogStatus {
    APPROVAL_PENDING,    // Submitted, awaiting review
    APPROVED,            // Approved by admin, published
    REJECTED,            // Rejected by admin
    DRAFT                // Saved as draft by user
}
```

### Status Transitions

```
┌─────────────┐
│    DRAFT    │ ←──────────────────────────┐
└─────────────┘                             │
       │                                    │
       │ User submits                       │
       ▼                                    │
┌─────────────────────┐                    │
│  APPROVAL_PENDING   │                    │
└─────────────────────┘                    │
       │                                    │
       ├──────────────┬─────────────────────┤
       │              │                     │
       │ Admin        │ Admin               │
       │ approves     │ rejects             │
       ▼              ▼                     │
┌─────────────┐  ┌─────────────┐          │
│  APPROVED   │  │  REJECTED   │ ─────────┘
└─────────────┘  └─────────────┘
                     User can edit
                     and resubmit
```

### Status Rules

1. **DRAFT**:
   - Initial state when user creates blog
   - Only visible to author
   - Can be edited without restrictions
   - Can be submitted for approval

2. **APPROVAL_PENDING**:
   - Set when user submits blog
   - Visible to admins only
   - Author cannot edit while pending
   - Admins can approve or reject

3. **APPROVED**:
   - Set by admin after review
   - Publicly visible
   - Author can edit (requires re-approval)
   - `reviewedAt` timestamp set
   - `reviewer` field populated

4. **REJECTED**:
   - Set by admin with rejection reason
   - Only visible to author
   - Author can edit and resubmit
   - `reviewedAt` timestamp set

## Blog Operations

### 1. Create Blog

**Service Method**: `createBlog(BlogCreateRequestDTO)`

**Process**:
1. Authenticate user via JWT
2. Validate category IDs exist
3. Create blog entity with status `APPROVAL_PENDING`
4. Associate location (if provided)
5. Save blog to generate ID
6. Add categories to blog
7. Validate and associate media
8. Update media asset trackers to `ASSOCIATED` status
9. Save final blog with all relationships

**Media Validation**:
- Each media URL must be validated via `validateBlogImageUrl()`
- Public ID extracted from URL
- Media asset tracker must exist with status `PENDING`
- Tracker updated to `ASSOCIATED` with blog ID

**Example Request**:
```json
{
  "title": "My First Blog",
  "body": "Full blog content here...",
  "summary": "Brief description",
  "categoryIds": [1, 5, 8],
  "locationId": 42,
  "mediaDetails": [
    {
      "mediaUrl": "https://res.cloudinary.com/.../image.jpg",
      "altText": "Image description",
      "displayOrder": 1
    }
  ]
}
```

### 2. Update Blog

**Service Method**: `updateBlog(Long blogId, BlogUpdateRequestDTO)`

**Authorization**:
- Only blog author can update
- Throws `UnauthorizedBlogActionException` if user != author

**Process**:
1. Fetch existing blog
2. Verify author ownership
3. Update fields via mapper
4. Handle media updates:
   - Keep existing media matching URLs
   - Delete removed media
   - Add new media
5. Update categories if provided
6. Update location if provided
7. Save updated blog

**Media Update Logic**:
- Compare existing media URLs with new URLs
- Delete orphaned media (not in new list)
- Mark removed assets as `MARKED_FOR_DELETE`
- Add new media from updated list

### 3. Update Blog Status (Admin Only)

**Service Method**: `updateBlogStatus(Long blogId, BlogStatusUpdateRequestDTO)`

**Authorization**:
- Requires admin role
- Uses `@PreAuthorize("hasRole('ADMIN')")`

**Process**:
1. Fetch blog by ID
2. Verify admin permissions
3. Update status
4. Set `reviewedAt` timestamp
5. Set `reviewer` to current admin user
6. Save blog

**Example Request**:
```json
{
  "status": "APPROVED"
}
```

### 4. Delete Blog (Soft Delete)

**Service Method**: `deleteBlog(Long blogId)`

**Authorization**:
- Author can delete own blogs
- Admins can delete any blog

**Process**:
1. Fetch blog by ID
2. Verify ownership or admin role
3. Mark associated media as `MARKED_FOR_DELETE`
4. Delete blog (triggers soft delete SQL)
5. `deleted_at` timestamp set automatically

**Soft Delete Behavior**:
- Blog not physically deleted
- `deleted_at` timestamp set
- Excluded from queries via `@Where(clause = "deleted_at IS NULL")`
- Can potentially be restored by admin

### 5. Hard Delete Blog (Admin Only)

**Service Method**: `hardDeleteBlog(Long blogId)`

**Authorization**:
- Admin only operation

**Process**:
1. Fetch blog (including soft-deleted ones)
2. Delete associated media from Cloudinary
3. Physically delete blog from database
4. Cascade deletes blog_media, blog_categories, etc.

## Media Management

### BlogMedia Entity

```java
@Entity
@Table(name = "blog_media")
public class BlogMedia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long mediaId;
    
    @ManyToOne
    private Blog blog;
    
    private String mediaUrl;           // Cloudinary URL
    private String altText;            // Accessibility text
    private Integer displayOrder;      // Order in blog
    
    @CreatedDate
    private LocalDateTime uploadedAt;
}
```

### Media Upload Workflow

1. **Frontend generates upload signature**:
   ```
   POST /api/image-storage/generate-signature
   {
     "contentType": "BLOG",
     "fileNames": ["image1.jpg", "image2.png"]
   }
   ```

2. **Signature response includes**:
   - Cloudinary signature
   - Timestamp
   - Public ID
   - Upload URL

3. **Frontend uploads directly to Cloudinary**:
   - Uses signed upload
   - Cloudinary returns secure URL

4. **Frontend creates/updates blog with media URLs**:
   - Includes Cloudinary URLs in request
   - Backend validates URLs via `validateBlogImageUrl()`
   - Backend associates media with blog

### Media Asset Tracking

**MediaAssetTracker** tracks all uploaded media:

```java
@Entity
public class MediaAssetTracker {
    private String publicId;              // Cloudinary public_id
    private Long userId;                  // Uploader
    private String contentType;           // BLOG or POST
    private Long contentId;               // Blog/Post ID
    private MediaAssetStatus status;      // PENDING, ASSOCIATED, MARKED_FOR_DELETE
    private LocalDateTime uploadedAt;
}
```

**Status Lifecycle**:
1. `PENDING`: Uploaded but not associated with blog
2. `ASSOCIATED`: Linked to blog
3. `MARKED_FOR_DELETE`: Blog deleted, queued for cleanup

**Cleanup Scheduler**:
- Runs every hour via `@Scheduled(fixedRate = 60 * 60 * 1000)`
- Deletes orphaned media older than 60 minutes
- Removes from Cloudinary and database

## Category System

### Blog Categories

Blogs support multiple categories for better organization:

```java
@Entity
@Table(name = "blog_categories")
public class BlogCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long blogCategoryId;
    
    @ManyToOne
    private Blog blog;
    
    @ManyToOne
    private Category category;
}
```

### Category Validation

**On Create/Update**:
1. Validate all category IDs exist
2. Throw `CategoryNotFoundException` if any missing
3. Report specific missing category IDs

**Example Error**:
```json
{
  "success": false,
  "message": "Categories not found with IDs: [99, 100]"
}
```

## Filtering & Search

### BlogSpecification

Uses JPA Criteria API for dynamic filtering:

```java
public class BlogSpecification {
    public static Specification<Blog> withFilters(
        String title,
        Long userId,
        Long categoryId,
        BlogStatus status,
        LocalDateTime fromDate,
        LocalDateTime toDate
    );
}
```

### Filter Capabilities

**By Title**:
- Case-insensitive partial match
- Example: "travel" matches "Travel Guide" and "Best Travel Tips"

**By Author**:
- Filter by user ID
- See all blogs by specific author

**By Category**:
- Filter by category ID
- Uses join to blog_categories table

**By Status**:
- Filter by approval status
- Example: Show only APPROVED blogs

**By Date Range**:
- Filter by creation date
- Supports from date and/or to date

### Pagination & Sorting

All list endpoints support:
- **Pagination**: `page` and `size` parameters
- **Sorting**: `sort` parameter (e.g., `createdAt,desc`)

**Example**:
```
GET /api/blogs?status=APPROVED&page=0&size=20&sort=createdAt,desc
```

## API Endpoints

### 1. Create Blog

**Endpoint**: `POST /api/blogs`

**Authentication**: Required

**Request Body**:
```json
{
  "title": "My Blog Title",
  "body": "Full blog content...",
  "summary": "Brief description",
  "categoryIds": [1, 2, 3],
  "locationId": 42,
  "mediaDetails": [
    {
      "mediaUrl": "https://res.cloudinary.com/.../image.jpg",
      "altText": "Image description",
      "displayOrder": 1
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Blog created successfully",
  "data": {
    "blogId": 123,
    "title": "My Blog Title",
    "blogStatus": "APPROVAL_PENDING",
    "wordCount": 450,
    "readTimeMinutes": 2,
    "createdAt": "2025-10-20T10:30:00"
  }
}
```

### 2. Get Blog by ID

**Endpoint**: `GET /api/blogs/{blogId}`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "blogId": 123,
    "title": "My Blog Title",
    "body": "Full content...",
    "summary": "Brief description",
    "wordCount": 450,
    "readTimeMinutes": 2,
    "blogStatus": "APPROVED",
    "author": {
      "userId": 456,
      "username": "john_doe",
      "profilePictureUrl": "https://..."
    },
    "categories": [
      {"categoryId": 1, "name": "Technology"},
      {"categoryId": 2, "name": "Travel"}
    ],
    "media": [
      {
        "mediaId": 789,
        "mediaUrl": "https://...",
        "altText": "Image description",
        "displayOrder": 1
      }
    ],
    "location": {
      "locationId": 42,
      "city": "New York",
      "country": "USA"
    },
    "createdAt": "2025-10-20T10:30:00",
    "updatedAt": "2025-10-20T11:00:00"
  }
}
```

### 3. Update Blog

**Endpoint**: `PATCH /api/blogs/{blogId}`

**Authentication**: Required (Author only)

**Request Body**: Same as create (all fields optional)

**Response**: Updated blog details

### 4. Update Blog Status (Admin)

**Endpoint**: `PATCH /api/blogs/{blogId}/status`

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "status": "APPROVED"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Blog status updated successfully",
  "data": {
    "blogId": 123,
    "blogStatus": "APPROVED",
    "reviewedAt": "2025-10-20T12:00:00",
    "reviewer": {
      "userId": 1,
      "username": "admin"
    }
  }
}
```

### 5. Get Filtered Blogs

**Endpoint**: `GET /api/blogs`

**Authentication**: Required

**Query Parameters**:
- `title`: Filter by title (partial match)
- `userId`: Filter by author
- `categoryId`: Filter by category
- `status`: Filter by status
- `fromDate`: Filter from date (ISO 8601)
- `toDate`: Filter to date (ISO 8601)
- `page`: Page number (default: 0)
- `size`: Page size (default: 20)
- `sort`: Sort field and direction (e.g., `createdAt,desc`)

**Example**:
```
GET /api/blogs?status=APPROVED&categoryId=1&page=0&size=10&sort=createdAt,desc
```

**Response**:
```json
{
  "success": true,
  "data": {
    "content": [/* array of blogs */],
    "totalElements": 50,
    "totalPages": 5,
    "size": 10,
    "number": 0
  }
}
```

### 6. Delete Blog (Soft Delete)

**Endpoint**: `DELETE /api/blogs/{blogId}`

**Authentication**: Required (Author or Admin)

**Response**:
```json
{
  "success": true,
  "message": "Blog deleted successfully"
}
```

### 7. Hard Delete Blog (Admin)

**Endpoint**: `DELETE /api/blogs/{blogId}/hard`

**Authentication**: Required (Admin only)

**Response**:
```json
{
  "success": true,
  "message": "Blog permanently deleted"
}
```

## Soft Deletion

### Implementation

**JPA Annotations**:
```java
@SQLDelete(sql = "UPDATE blogs SET deleted_at = NOW() WHERE blog_id = ?")
@Where(clause = "deleted_at IS NULL")
```

**Behavior**:
- DELETE operation executes UPDATE instead
- Sets `deleted_at` timestamp
- All queries automatically filter out deleted rows
- Referential integrity maintained

### Benefits

1. **Data Recovery**: Deleted blogs can be restored
2. **Audit Trail**: Maintain history of all content
3. **Cascade Control**: Can choose to hard delete later
4. **Analytics**: Track deletion patterns

### Querying Deleted Blogs

To include soft-deleted blogs (admin use case):

```java
// Disable filter temporarily
@Query("SELECT b FROM Blog b WHERE b.blogId = :id")
Optional<Blog> findByIdIncludingDeleted(@Param("id") Long id);
```

## Best Practices

### 1. Media Management

✅ **Always validate media URLs** before associating with blog  
✅ **Use MediaAssetTracker** for all uploads  
✅ **Mark media for deletion** when removing from blog  
✅ **Let scheduler handle cleanup** - don't delete immediately

### 2. Authorization

✅ **Check ownership** on update/delete operations  
✅ **Use `@PreAuthorize`** for admin-only endpoints  
✅ **Return 403 Forbidden** for unauthorized access  
✅ **Log security events** for audit trail

### 3. Status Workflow

✅ **Default to APPROVAL_PENDING** on creation  
✅ **Only admins** can change status  
✅ **Set reviewedAt timestamp** on approval/rejection  
✅ **Record reviewer** for accountability

### 4. Category Validation

✅ **Validate all categories exist** before saving  
✅ **Provide specific error messages** for missing categories  
✅ **Require at least one category** per blog

### 5. Performance

✅ **Use pagination** for list endpoints  
✅ **Lazy load** relationships where possible  
✅ **Index frequently queried fields** (user_id, status, created_at)  
✅ **Use Specifications** for dynamic filtering

### 6. Error Handling

✅ **Use custom exceptions** (`BlogNotFoundException`, `UnauthorizedBlogActionException`)  
✅ **Return meaningful error messages**  
✅ **Log errors** with appropriate level  
✅ **Include correlation IDs** for debugging

## Conclusion

The Kaleidoscope Blog System provides a robust platform for long-form content creation with:

✅ **Approval Workflow**: Admin review before publication  
✅ **Rich Media Support**: Multiple images per blog via Cloudinary  
✅ **Soft Deletion**: Non-destructive removal with recovery option  
✅ **Category System**: Multi-category organization  
✅ **Automatic Metrics**: Word count and read time calculation  
✅ **Flexible Filtering**: Search by multiple criteria  
✅ **Security**: Author-based permissions with admin override  
✅ **Media Tracking**: Automatic cleanup of orphaned assets

The system balances user freedom with content moderation, ensuring quality while maintaining operational efficiency through automated processes like media cleanup and metric calculation.

