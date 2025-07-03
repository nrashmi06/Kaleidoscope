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
- **Response**: `CategoryResponseDTO`, `CategoryParentResponseDTO`, `CategoryParentListResponseDTO`

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

### 1. Get All Parent Categories

#### Get Top-Level Categories
```
GET /api/categories
Authorization: Bearer token required

Response: 200 OK
{
  "success": true,
  "message": "Parent categories retrieved successfully",
  "data": {
    "categories": [
      {
        "categoryId": 1,
        "name": "Technology",
        "description": "Tech related content and discussions",
        "iconName": "tech-icon",
        "parentId": null
      },
      {
        "categoryId": 2,
        "name": "Science",
        "description": "Scientific research and discoveries",
        "iconName": "science-icon",
        "parentId": null
      },
      {
        "categoryId": 3,
        "name": "Arts",
        "description": "Creative arts and cultural content",
        "iconName": "arts-icon",
        "parentId": null
      }
    ]
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories"
}
```

**Response Structure:**
- Returns `CategoryParentListResponseDTO` containing list of `CategoryParentResponseDTO`
- Each parent category includes: `categoryId`, `name`, `description`, `iconName`, `parentId`
- Only top-level categories (parentId = null) are returned
- No subcategory information in this endpoint

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
Authorization: Bearer token required (ADMIN role)
Content-Type: application/json

Body:
{
  "name": "Web Development",
  "description": "Frontend and backend web development",
  "iconName": "web-icon",
  "parentId": 1
}

Response: 201 CREATED
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "categoryId": 8,
    "name": "Web Development",
    "description": "Frontend and backend web development",
    "iconName": "web-icon",
    "parentId": 1,
    "subcategories": []
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories"
}
```

**Request Fields:**
- `name` (required): Category name (2-50 characters, unique)
- `description` (optional): Category description (max 255 characters)
- `iconName` (optional): Icon identifier (max 50 characters)
- `parentId` (optional): Parent category ID for hierarchical structure

**Validation:**
- `@NotBlank` on name field
- `@Size(min = 2, max = 50)` for name
- `@Size(max = 255)` for description
- `@Size(max = 50)` for iconName

**Error Scenarios:**
- Admin role required → 403 FORBIDDEN
- Category name already exists → 400 BAD_REQUEST
- Invalid parent ID → 400 BAD_REQUEST
- Validation failures → 400 BAD_REQUEST

### 4. Update Category (Admin)

#### Update Existing Category
```
PUT /api/categories/{categoryId}
Authorization: Bearer token required (ADMIN role)
Content-Type: application/json

Body:
{
  "name": "Web Development & Design",
  "description": "Frontend, backend development and UI/UX design",
  "iconName": "web-design-icon",
  "parentId": 1
}

Response: 200 OK
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "categoryId": 8,
    "name": "Web Development & Design",
    "description": "Frontend, backend development and UI/UX design",
    "iconName": "web-design-icon",
    "parentId": 1,
    "subcategories": []
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories"
}
```

**Features:**
- Updates category with provided fields
- Same validation rules as create operation
- Preserves existing subcategories
- Can change parent category for restructuring

**Error Scenarios:**
- Category not found → 404 NOT_FOUND
- Admin role required → 403 FORBIDDEN
- Name already exists → 400 BAD_REQUEST

### 5. Delete Category (Admin)

#### Delete Category
```
DELETE /api/categories/{categoryId}
Authorization: Bearer token required (ADMIN role)

Response: 200 OK
{
  "success": true,
  "message": "Category deleted successfully",
  "data": "Category with ID 8 deleted successfully",
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/categories"
}
```

**Features:**
- Deletes category and all subcategories (CASCADE)
- Removes associated user interests
- Admin role required for operation

**Error Scenarios:**
- Category not found → 404 NOT_FOUND
- Admin role required → 403 FORBIDDEN

## Database Model

### Category Entity
```java
@Entity
@Table(name = "categories")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryId;
    
    @Column(nullable = false, unique = true, length = 50)
    private String name;
    
    @Column(length = 255)
    private String description;
    
    @Column(name = "icon_name", length = 50)
    private String iconName;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;
    
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private Set<Category> subcategories;
    
    @OneToMany(mappedBy = "category")
    private Set<UserInterest> interestedUsers;
}
```

**Key Features:**
- Self-referencing relationship for hierarchy
- Unique constraint on category name
- Cascade operations for subcategories
- Integration with UserInterest system

## Security & Authorization

### Authentication
- All endpoints require valid JWT token
- Uses `@PreAuthorize("isAuthenticated()")` for read operations

### Authorization
- Create, Update, Delete operations require `ROLE_ADMIN`
- Uses `@PreAuthorize("hasRole('ROLE_ADMIN')")`
- Read operations available to all authenticated users

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": ["Validation error details"],
  "timestamp": 1751455561337,
  "path": "/api/categories/endpoint"
}
```

### Status Codes
- **200 OK**: Successful operation
- **201 CREATED**: Category created successfully
- **400 BAD_REQUEST**: Validation errors or invalid data
- **401 UNAUTHORIZED**: Authentication required
- **403 FORBIDDEN**: Admin role required
- **404 NOT_FOUND**: Category not found

## Bruno API Test Suite

Your existing Bruno API test collection in `Kaleidoscope-api-test/category/`:

1. **get all top most categories.bru** - Retrieve parent categories
2. **get category by id with its childs.bru** - Get category with subcategories
3. **add category for admin.bru** - Create new category (admin)
4. **Update category by id.bru** - Update existing category (admin)
5. **Delete category by id.bru** - Delete category (admin)

### Test Features:
- Environment variables for base URL and tokens
- Admin role validation
- Hierarchy testing
- Error scenario coverage

## Service Implementation

### Key Methods
- `getAllParentCategories()`: Returns all top-level categories
- `getCategoryWithChildren(Long categoryId)`: Returns category with subcategories
- `createCategory(CategoryRequestDTO)`: Creates new category
- `updateCategory(Long categoryId, CategoryRequestDTO)`: Updates category
- `deleteCategory(Long categoryId)`: Deletes category and subcategories

This category management system provides hierarchical organization capabilities with proper admin controls and integration with the user interest system in the Kaleidoscope application.
