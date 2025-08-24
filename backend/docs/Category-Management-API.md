# Category Management API Documentation

## Overview
Hierarchical category management system with parent-child relationships and admin controls for organizing content and user interests in the Kaleidoscope application.

## Created Components

### 1. Routes (CategoryRoutes.java)
- `GET_ALL_PARENT_CATEGORIES`: GET `/api/categories`
- `GET_CATEGORY_BY_ID`: GET `/api/categories/{categoryId}`
- `CREATE_CATEGORY`: POST `/api/categories`
- `UPDATE_CATEGORY`: PUT `/api/categories/{categoryId}`
- `DELETE_CATEGORY`: DELETE `/api/categories/{categoryId}`

### 2. DTOs
- **Request**: `CategoryRequestDTO`
- **Response**: `CategoryResponseDTO`

### 3. Features
- Hierarchical category structure with parent-child relationships
- Admin-only category management (create, update, delete)
- Category tree navigation with subcategories
- Icon and description support
- Validation for category names and descriptions

### 4. Model
- `Category` entity with self-referencing parent-child relationship
- Integration with `UserInterest` for user category preferences
- Unique category names with cascade operations

### 5. Security
- Authentication required for all operations
- Admin role (`ROLE_ADMIN`) required for CUD operations
- Public read access for authenticated users

## API Endpoints

### 1. Get All Parent Categories (Paginated)

#### Get Top-Level Categories
```
GET /api/categories?page=0&size=10
Authorization: Bearer token required

Response: 200 OK
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
    "size": 10,
    "number": 0,
    "first": true,
    "last": true
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories"
}
```

**Response Structure:**
- Returns a paginated `Page<CategoryResponseDTO>` in the `data` field
- Each parent category includes: `categoryId`, `name`, `description`, `iconName`, `parentId`, `subcategories` (empty for top-level)
- Pagination info: `content`, `totalElements`, `totalPages`, `size`, `number`, etc.
- Only top-level categories (parentId = null) are returned

### 2. Get Category by ID

#### Get Specific Category with Subcategories
```
GET /api/categories/{categoryId}
Authorization: Bearer token required

Response: 200 OK
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

### 3. Create Category (Admin)

#### Create New Category
```
POST /api/categories
Authorization: Bearer token required, Admin role required
Content-Type: application/json

Request Body:
{
  "name": "New Category",
  "description": "Description of the category",
  "iconName": "icon-name",
  "parentId": 1
}

Response: 201 CREATED
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

### 4. Update Category (Admin)

#### Update Existing Category
```
PUT /api/categories/{categoryId}
Authorization: Bearer token required, Admin role required
Content-Type: application/json

Request Body:
{
  "name": "Updated Category",
  "description": "Updated description",
  "iconName": "updated-icon",
  "parentId": null
}

Response: 200 OK
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "categoryId": 1,
    "name": "Updated Category",
    "description": "Updated description",
    "iconName": "updated-icon",
    "parentId": null,
    "subcategories": [ ... ]
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories/1"
}
```

### 5. Delete Category (Admin)

#### Delete Category by ID
```
DELETE /api/categories/{categoryId}
Authorization: Bearer token required, Admin role required

Response: 200 OK
{
  "success": true,
  "message": "Category deleted successfully",
  "data": "Category with ID 1 deleted successfully",
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories/1"
}
```
