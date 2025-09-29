# User Interests API Documentation

## Overview
Manage user category interests to personalize content and recommendations within the Kaleidoscope application. Supports single and bulk operations, intelligent hierarchy filtering, and admin analytics.

**Base URL**: `/api/users/interests`

## Created Components

### 1. Routes (UserInterestRoutes.java)
- `ADD_USER_INTEREST`: POST `/api/users/interests`
- `ADD_USER_INTERESTS_BULK`: POST `/api/users/interests/bulk`
- `REMOVE_USER_INTEREST`: DELETE `/api/users/interests/{categoryId}`
- `REMOVE_USER_INTERESTS_BULK`: DELETE `/api/users/interests/bulk`
- `GET_USER_INTERESTS`: GET `/api/users/interests`
- `GET_USER_INTERESTS_BY_USER_ID`: GET `/api/users/interests/user/{userId}` (Admin only)
- `ADMIN_GET_CATEGORY_ANALYTICS`: GET `/api/users/interests/admin/category-analytics` (Admin only)

### 2. DTOs
- **Request**: `AddUserInterestRequestDTO` (categoryId with @NotNull and @Positive validation), `BulkUserInterestRequestDTO` (categoryIds list)
- **Response**: `UserInterestResponseDTO` (interestId, userId, category with full hierarchy, createdAt), `PaginatedResponse<UserInterestResponseDTO>`, `CategoryAnalyticsResponseDTO.CategoryStats`

### 3. Features
- Complete user interest management with validation
- Individual and bulk add/remove operations
- Paginated interest retrieval with category hierarchy
- Admin-only user interest viewing by user ID
- Admin category analytics with pagination
- Uses `PaginatedResponse<T>` wrapper for consistent pagination

### 4. Model
- `UserInterest` entity: links `User` and `Category` with timestamp
- Integration with Category hierarchy system
- Comprehensive validation with custom messages

### 5. Security
- Authentication required for all user operations (`@PreAuthorize("isAuthenticated()")`)
- Admin role required for analytics and user-specific endpoints (`@PreAuthorize("hasRole('ROLE_ADMIN')")`)

## API Endpoints

### 1. Add Single Interest

#### Add Category Interest for Current User
```
POST /api/users/interests
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (`AddUserInterestRequestDTO`):
```json
{ "categoryId": 123 }
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8080/kaleidoscope/api/users/interests" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{ "categoryId": 123 }'
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Interest added successfully",
  "data": null,
  "errors": [],
  "timestamp": 1625235000000,
  "path": "/api/users/interests"
}
```

**Request Fields** (`AddUserInterestRequestDTO`):
- `categoryId` (`@NotNull`, `@Positive`): Category ID to add as interest

**Error Scenarios:**
- `400 BAD_REQUEST` if categoryId missing or non-positive
- `404 NOT_FOUND` if category not found
- `409 CONFLICT` if interest already exists

### 2. Remove Single Interest

#### Remove Category Interest for Current User
```
DELETE /api/users/interests/{categoryId}
Authorization: Bearer <accessToken>
```

**cURL Example**:
```bash
curl -X DELETE "http://localhost:8080/kaleidoscope/api/users/interests/123" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Interest removed successfully",
  "data": null,
  "errors": [],
  "timestamp": 1625235050000,
  "path": "/api/users/interests/{categoryId}"
}
```

**Error Scenarios:**
- `404 NOT_FOUND` if interest does not exist
- `401 UNAUTHORIZED` if not authenticated

### 3. Get Current User's Interests

#### Get Paginated List of User's Category Interests
```
GET /api/users/interests?page=0&size=10&sort=createdAt,desc
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: varies)
- `sort` (optional): Sort criteria (default: varies)

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/users/interests?page=0&size=10" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "User interests retrieved successfully",
  "data": {
    "content": [
      {
        "interestId": 5,
        "userId": 1,
        "category": {
          "categoryId": 1,
          "name": "Technology",
          "description": "Tech content",
          "iconName": "tech-icon",
          "parentId": null,
          "subcategories": []
        },
        "createdAt": "2025-07-02T16:55:54Z"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "currentPage": 0,
    "pageSize": 10,
    "hasNext": false,
    "hasPrevious": false,
    "isFirst": true,
    "isLast": true
  },
  "errors": [],
  "timestamp": 1625235100000,
  "path": "/api/users/interests"
}
```

**Response Structure** (`PaginatedResponse<UserInterestResponseDTO>`):
- `content`: List of `UserInterestResponseDTO` objects
- Standard pagination metadata fields
- Each interest includes complete category hierarchy

### 4. Add Multiple Interests (Bulk)

#### Add Multiple Category Interests
```
POST /api/users/interests/bulk
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (`BulkUserInterestRequestDTO`):
```json
{ "categoryIds": [1, 2, 3] }
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8080/kaleidoscope/api/users/interests/bulk" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{ "categoryIds": [1, 2, 3] }'
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Interests added successfully",
  "data": null,
  "errors": [],
  "timestamp": 1625235150000,
  "path": "/api/users/interests/bulk"
}
```

**Error Scenarios:**
- `400 BAD_REQUEST` for empty or invalid lists
- `404 NOT_FOUND` for missing categories

### 5. Remove Multiple Interests (Bulk)

#### Remove Multiple Category Interests
```
DELETE /api/users/interests/bulk
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (`BulkUserInterestRequestDTO`):
```json
{ "categoryIds": [1, 2, 3] }
```

**cURL Example**:
```bash
curl -X DELETE "http://localhost:8080/kaleidoscope/api/users/interests/bulk" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{ "categoryIds": [1, 2, 3] }'
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Interests removed successfully",
  "data": null,
  "errors": [],
  "timestamp": 1625235200000,
  "path": "/api/users/interests/bulk"
}
```

### 6. Admin: Get Interests by User ID

#### Get Specific User's Category Interests (Admin Only)
```
GET /api/users/interests/user/{userId}?page=0&size=10
Authorization: Bearer <accessToken>
Role Required: ROLE_ADMIN
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/users/interests/user/42?page=0&size=10" \
  -H "Authorization: Bearer your-admin-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "User interests retrieved successfully",
  "data": {
    "content": [
      {
        "interestId": 15,
        "userId": 42,
        "category": {
          "categoryId": 2,
          "name": "Science",
          "description": "Scientific content",
          "iconName": "science-icon",
          "parentId": null,
          "subcategories": []
        },
        "createdAt": "2025-07-01T14:30:00Z"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "currentPage": 0,
    "pageSize": 10,
    "hasNext": false,
    "hasPrevious": false,
    "isFirst": true,
    "isLast": true
  },
  "errors": [],
  "timestamp": 1625235250000,
  "path": "/api/users/interests/user/42"
}
```

**Features:**
- Admin-only access with `@PreAuthorize("hasRole('ROLE_ADMIN')")`
- Same response structure as current user interests
- Paginated results with complete category hierarchy

### 7. Admin: Category Interest Analytics

#### Get Category Interest Statistics (Admin Only)
```
GET /api/users/interests/admin/category-analytics?page=0&size=10&sort=count,desc
Authorization: Bearer <accessToken>
Role Required: ROLE_ADMIN
```

**Query Parameters:**
- `page`, `size`: Pagination controls
- `sort`: Sorting criteria (typically by count)

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/users/interests/admin/category-analytics?page=0&size=10" \
  -H "Authorization: Bearer your-admin-jwt-token"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Category interest analytics retrieved successfully",
  "data": {
    "content": [
      {
        "categoryId": 1,
        "categoryName": "Technology",
        "interestCount": 250
      },
      {
        "categoryId": 2,
        "categoryName": "Science",
        "interestCount": 180
      }
    ],
    "totalElements": 50,
    "totalPages": 5,
    "currentPage": 0,
    "pageSize": 10,
    "hasNext": true,
    "hasPrevious": false,
    "isFirst": true,
    "isLast": false
  },
  "errors": [],
  "timestamp": 1625235300000,
  "path": "/api/users/interests/admin/category-analytics"
}
```

**Response Structure** (`PaginatedResponse<CategoryAnalyticsResponseDTO.CategoryStats>`):
- Returns paginated category statistics
- Each stat includes category information and interest count
- Admin-only access for analytics insights

## Security & Authorization

### Authentication
- All endpoints require valid JWT token
- Uses `@PreAuthorize("isAuthenticated()")` for user operations

### Authorization
- Admin operations require `ROLE_ADMIN`
- Uses `@PreAuthorize("hasRole('ROLE_ADMIN')")` for:
  - Getting interests by user ID
  - Category analytics
- Regular users can only manage their own interests

### Validation
- Category ID validation with `@NotNull` and `@Positive`
- Bulk operation validation with `@Valid`
- Service layer handles business logic validation

## Error Response Format
All endpoints return standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": ["Specific error details"],
  "timestamp": 1625235000000,
  "path": "/api/users/interests/{endpoint}"
}
```

### Status Codes
- **200 OK**: Successful operation
- **400 BAD_REQUEST**: Invalid input data or validation errors
- **401 UNAUTHORIZED**: Authentication required
- **403 FORBIDDEN**: Admin role required
- **404 NOT_FOUND**: Interest or category not found
- **409 CONFLICT**: Interest already exists

## Service Implementation

### Key Methods (UserInterestService)
- `addUserInterest(Long categoryId)`: Add single interest
- `removeUserInterest(Long categoryId)`: Remove single interest
- `getUserInterests(Pageable pageable)`: Get current user's interests (paginated)
- `addUserInterests(List<Long> categoryIds)`: Bulk add interests
- `removeUserInterests(List<Long> categoryIds)`: Bulk remove interests
- `getUserInterestsByUserId(Long userId, Pageable pageable)`: Admin method for specific user
- `getCategoryInterestAnalytics(Pageable pageable)`: Admin analytics method

### Controller Implementation (UserInterestController)
- Implements `UserInterestApi` interface for Swagger documentation
- Uses `@Valid` for request validation
- Returns standardized `ApiResponse<T>` wrapper
- Uses `PaginatedResponse.fromPage()` for consistent pagination
- Separate admin endpoints with role-based security

## Bruno API Test Suite
Located under `Kaleidoscope-api-test/user-interests/`:
- Add single interest
- Remove single interest
- Get user interests (paginated)
- Bulk add interests
- Bulk remove interests
- Admin: Get interests by user ID
- Admin: Category analytics

## Features Implemented
✅ Single and bulk interest management  
✅ Paginated interest retrieval with category hierarchy  
✅ Admin-only user interest viewing by user ID  
✅ Admin category analytics with statistics  
✅ Comprehensive validation with custom error messages  
✅ Role-based access control for admin operations  
✅ Consistent pagination using `PaginatedResponse<T>`  
✅ Swagger documentation via UserInterestApi interface  
✅ Context path support (/kaleidoscope)

## Advanced Features
- **Full Category Hierarchy**: Subcategories included in responses
- **Batch Operations**: Efficient bulk add/remove operations
- **Admin Analytics**: Interest statistics for content strategy
- **Validation**: Comprehensive input validation with meaningful error messages

## Error Scenarios Handled
- Duplicate interest → 409 CONFLICT  
- Missing interest/category → 404 NOT_FOUND  
- Invalid category ID → 400 BAD_REQUEST (validation)  
- Unauthorized access → 401 UNAUTHORIZED  
- Forbidden admin operations → 403 FORBIDDEN  
- Empty bulk operations → 400 BAD_REQUEST
