# Category Management API Documentation

## Overview
Hierarchical category management system with parent-child relationships and admin controls for organizing content and user interests in the Kaleidoscope application.

**Base URL**: `/api/categories`

## Created Components

### 1. Routes (CategoryRoutes.java)
- `GET_ALL_PARENT_CATEGORIES`: GET `/api/categories`
- `GET_CATEGORY_BY_ID`: GET `/api/categories/{categoryId}`
- `CREATE_CATEGORY`: POST `/api/categories`
- `UPDATE_CATEGORY`: PUT `/api/categories/{categoryId}`
- `DELETE_CATEGORY`: DELETE `/api/categories/{categoryId}`

### 2. DTOs
- **Request**: `CategoryRequestDTO` (name, description, iconName, parentId)
- **Response**: `CategoryResponseDTO` (categoryId, name, description, iconName, parentId, subcategories)

### 3. Features
- Hierarchical category structure with parent-child relationships
- Admin-only category management (create, update, delete)
- Category tree navigation with subcategories
- Icon and description support
- Validation for category names and descriptions
- Paginated parent category listing

### 4. Model
- `Category` entity with self-referencing parent-child relationship
- Integration with `UserInterest` for user category preferences
- Unique category names with cascade operations

### 5. Security
- Authentication required for all operations (`@PreAuthorize("isAuthenticated()")`)
- Admin role (`ROLE_ADMIN`) required for CUD operations (`@PreAuthorize("hasRole('ROLE_ADMIN')")`)
- Public read access for authenticated users

## API Endpoints

### 1. Get All Parent Categories (Paginated)

#### Get Top-Level Categories
```
GET /api/categories?page=0&size=10
Authorization: Bearer <accessToken>
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/categories?page=0&size=10" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Parent categories retrieved successfully",
  "data": {
    "content": [
      {
        "categoryId": 1,
        "name": "Technology",
        "description": "Tech related content and discussions",
        "iconName": "tech-icon",
        "parentId": null,
        "subcategories": []
      },
      {
        "categoryId": 2,
        "name": "Science",
        "description": "Scientific research and discoveries",
        "iconName": "science-icon",
        "parentId": null,
        "subcategories": []
      }
    ],
    "totalElements": 2,
    "totalPages": 1,
    "currentPage": 0,
    "pageSize": 10,
    "hasNext": false,
    "hasPrevious": false,
    "isFirst": true,
    "isLast": true
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories"
}
```

**Response Structure:**
- Returns `PaginatedResponse<CategoryResponseDTO>` in the `data` field
- Each parent category includes: `categoryId`, `name`, `description`, `iconName`, `parentId`, `subcategories` (empty for top-level)
- Pagination info: `content`, `totalElements`, `totalPages`, `currentPage`, `pageSize`, etc.
- Only top-level categories (parentId = null) are returned

### 2. Get Category by ID

#### Get Specific Category with Subcategories
```
GET /api/categories/{categoryId}
Authorization: Bearer <accessToken>
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/categories/1" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "categoryId": 1,
    "name": "Technology",
    "description": "Tech related content and discussions",
    "iconName": "tech-icon",
    "parentId": null,
    "subcategories": [
      {
        "categoryId": 4,
        "name": "Programming",
        "description": "Software development and coding",
        "iconName": "code-icon",
        "parentId": 1,
        "subcategories": [
          {
            "categoryId": 7,
            "name": "JavaScript",
            "description": "JavaScript programming language",
            "iconName": "js-icon",
            "parentId": 4,
            "subcategories": []
          }
        ]
      },
      {
        "categoryId": 5,
        "name": "AI & Machine Learning",
        "description": "Artificial Intelligence and ML topics",
        "iconName": "ai-icon",
        "parentId": 1,
        "subcategories": []
      }
    ]
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories/1"
}
```

**Response Structure:**
- Returns `CategoryResponseDTO` with complete hierarchy
- Includes all subcategories as `Set<CategoryResponseDTO>`
- Recursive structure showing unlimited depth
- Each subcategory can have its own subcategories

**Error Scenarios:**
- Category not found → 404 NOT_FOUND

### 3. Create Category (Admin Only)

#### Create New Category
```
POST /api/categories
Authorization: Bearer <accessToken>
Content-Type: application/json
Role Required: ROLE_ADMIN
```

**Request Body** (`CategoryRequestDTO`):
```json
{
  "name": "New Category",
  "description": "Description of the category",
  "iconName": "icon-name",
  "parentId": 1
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8080/kaleidoscope/api/categories" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Category",
    "description": "Description of the category",
    "iconName": "icon-name",
    "parentId": 1
  }'
```

**Response**: `201 CREATED`
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "categoryId": 10,
    "name": "New Category",
    "description": "Description of the category",
    "iconName": "icon-name",
    "parentId": 1,
    "subcategories": []
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories"
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters
- `description`: Optional, max 255 characters
- `iconName`: Optional, max 50 characters
- `parentId`: Optional Long (must exist if provided)

**Error Scenarios:**
- Validation errors → 400 BAD_REQUEST
- Insufficient permissions → 403 FORBIDDEN
- Parent category not found → 404 NOT_FOUND

### 4. Update Category (Admin Only)

#### Update Existing Category
```
PUT /api/categories/{categoryId}
Authorization: Bearer <accessToken>
Content-Type: application/json
Role Required: ROLE_ADMIN
```

**Request Body** (`CategoryRequestDTO`):
```json
{
  "name": "Updated Category",
  "description": "Updated description",
  "iconName": "updated-icon",
  "parentId": null
}
```

**cURL Example**:
```bash
curl -X PUT "http://localhost:8080/kaleidoscope/api/categories/1" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Category",
    "description": "Updated description",
    "iconName": "updated-icon",
    "parentId": null
  }'
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "categoryId": 1,
    "name": "Updated Category",
    "description": "Updated description",
    "iconName": "updated-icon",
    "parentId": null,
    "subcategories": []
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories/1"
}
```

**Error Scenarios:**
- Category not found → 404 NOT_FOUND
- Validation errors → 400 BAD_REQUEST
- Insufficient permissions → 403 FORBIDDEN

### 5. Delete Category (Admin Only)

#### Delete Category by ID
```
DELETE /api/categories/{categoryId}
Authorization: Bearer <accessToken>
Role Required: ROLE_ADMIN
```

**cURL Example**:
```bash
curl -X DELETE "http://localhost:8080/kaleidoscope/api/categories/1" \
  -H "Authorization: Bearer your-admin-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": "Category with ID 1 deleted successfully",
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories/1"
}
```

**Error Scenarios:**
- Category not found → 404 NOT_FOUND
- Insufficient permissions → 403 FORBIDDEN
- Category has dependent relationships → 409 CONFLICT

## Error Response Format
All endpoints return standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "path": "/api/categories/{endpoint}",
  "timestamp": 1751455561337,
  "error": "Error type",
  "status": 400
}
```

## Category Hierarchy Structure
- **Root Categories**: `parentId = null` (top-level categories)
- **Subcategories**: `parentId = {parent_category_id}` 
- **Recursive Structure**: Unlimited depth supported
- **Cascade Operations**: Deleting parent affects children (implementation dependent)

## Validation Rules
### CategoryRequestDTO Constraints:
- **name**: `@NotBlank`, `@Size(min=2, max=50)`
- **description**: `@Size(max=255)` (optional)
- **iconName**: `@Size(max=50)` (optional)
- **parentId**: Optional Long (must exist if provided)

## Security Implementation
- **Authentication**: All endpoints require valid JWT token
- **Authorization**: 
  - Read operations: Any authenticated user
  - CUD operations: `ROLE_ADMIN` required
- **Method-Level Security**: `@PreAuthorize` annotations

## Bruno API Test Suite
Located under `Kaleidoscope-api-test/category/`:
- Test files for all CRUD operations
- Admin role testing scenarios
- Hierarchical structure validation

## Features Implemented
✅ Hierarchical category structure with unlimited depth  
✅ Admin-only category management (Create, Update, Delete)  
✅ Paginated parent category listing  
✅ Category with subcategories retrieval  
✅ Comprehensive validation on category data  
✅ Role-based access control  
✅ Swagger documentation via CategoryApi interface  
✅ Standardized API response format  
✅ Context path support (/kaleidoscope)

## Integration Points
- **UserInterest**: Categories can be associated with user interests
- **Posts/Blogs**: Content can be categorized using this system
- **Search**: Categories enhance content discoverability
