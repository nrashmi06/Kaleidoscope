# User Interests API Documentation

## Overview
Manage user category interests to personalize content and recommendations within the Kaleidoscope application. Supports single and bulk operations, intelligent hierarchy filtering, and admin analytics.

## Created Components

### 1. Routes (UserInterestRoutes.java)
- POST   `/api/users/interests`            → Add single interest
- POST   `/api/users/interests/bulk`       → Add multiple interests
- DELETE `/api/users/interests/{categoryId}` → Remove single interest
- DELETE `/api/users/interests/bulk`      → Remove multiple interests
- GET    `/api/users/interests`            → Get current user's interests
- GET    `/api/users/interests/user/{userId}` → Get interests by user ID
- GET    `/api/users/interests/admin/category-analytics` → Admin: category interest analytics

### 2. DTOs
- **Request**
  - `AddUserInterestRequestDTO`          (categoryId: Long)
  - `BulkUserInterestRequestDTO`         (categoryIds: List<Long>)
- **Response**
  - `UserInterestResponseDTO`            (interestId, userId, category with full hierarchy, createdAt)
  - `UserInterestListResponseDTO`        (List<UserInterestResponseDTO>, pagination metadata)
  - `CategoryAnalyticsResponseDTO`       (Map<categoryId, count> with pagination)

### 3. Service Layer (UserInterestService)
Provides methods:
- `addUserInterest(Long categoryId)`
- `removeUserInterest(Long categoryId)`
- `getUserInterests(Pageable pageable)`
- `addUserInterests(List<Long> categoryIds)`
- `removeUserInterests(List<Long> categoryIds)`
- `getUserInterestsByUserId(Long userId, Pageable pageable)`
- `getCategoryInterestAnalytics(Pageable pageable)` (admin only)
Implements validation, intelligent redundancy filtering, and batch operations.

### 4. Controller (UserInterestController.java)
- Uses `@RestController`, `@RequiredArgsConstructor`, `@Tag(name="User Interest")`
- Endpoints return `ApiResponse<T>` wrappers
- Swagger annotations for each operation
- Security: `@PreAuthorize("isAuthenticated()")` or `hasRole('ROLE_ADMIN')`

### 5. Model and Repository
- `UserInterest` entity: links `User` and `Category` with timestamp
- `UserInterestRepository`: methods for exists, bulk fetch, pagination

### 6. Exceptions
- `UserInterestNotFoundException` → 404 if interest not found
- `UserInterestAlreadyExistsException` → 409 if duplicate
- Validation errors → 400
- Unauthorized → 401
- Forbidden (admin-only) → 403

### 7. Security
- All endpoints require valid JWT token
- Admin role required for analytics endpoint

## API Endpoints

### 1. Add Single Interest
```
POST /api/users/interests
Authorization: Bearer <token>
Content-Type: application/json
```
**Body** (`AddUserInterestRequestDTO`):
```json
{ "categoryId": 123 }
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
**Errors**:
- `400 BAD_REQUEST` if categoryId missing or non-positive
- `404 NOT_FOUND` if category not found
- `409 CONFLICT` if interest already exists

### 2. Remove Single Interest
```
DELETE /api/users/interests/{categoryId}
Authorization: Bearer <token>
```
**Response**: `200 OK`
```json
{ "success": true, "message": "Interest removed successfully", "data": null }
```
**Errors**:
- `404 NOT_FOUND` if interest does not exist
- `401/403` as above

### 3. Get Current User's Interests
```
GET /api/users/interests?page=0&size=10&sort=createdAt,desc
Authorization: Bearer <token>
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "User interests retrieved successfully",
  "data": {
    "interests": [
      {
        "interestId": 5,
        "userId": 1,
        "category": {
          "categoryId": 1,
          "name": "Technology",
          "description": "Tech content",
          "parentId": null,
          "subcategories": []
        },
        "createdAt": "2025-07-02T16:55:54Z"
      }
    ],
    "currentPage": 0,
    "totalPages": 1,
    "totalElements": 1
  },
  "errors": [],
  "timestamp": 1625235100000,
  "path": "/api/users/interests"
}
```

### 4. Add Multiple Interests (Bulk)
```
POST /api/users/interests/bulk
Authorization: Bearer <token>
Content-Type: application/json
```
**Body** (`BulkUserInterestRequestDTO`):
```json
{ "categoryIds": [1,2,3] }
```
**Response**: `200 OK`
```json
{ "success": true, "message": "Interests added successfully", "data": null }
```
**Errors**:
- `400 BAD_REQUEST` for empty or invalid lists
- `404 NOT_FOUND` for missing categories

### 5. Remove Multiple Interests (Bulk)
```
DELETE /api/users/interests/bulk
Authorization: Bearer <token>
Content-Type: application/json
```
**Body**:
```json
{ "categoryIds": [1,2,3] }
```
**Response**: `200 OK`
```json
{ "success": true, "message": "Interests removed successfully", "data": null }
```

### 6. Get Interests by User ID
```
GET /api/users/interests/user/{userId}?page=0&size=10
Authorization: Bearer <token>
```
**Response**: Paginated `UserInterestListResponseDTO` (same format as current user)

### 7. Admin: Category Interest Analytics
```
GET /api/users/interests/admin/category-analytics?page=0&size=10&sort=count,desc
Authorization: Bearer <token> (ADMIN)
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Category analytics retrieved successfully",
  "data": {
    "analytics": [ { "categoryId": 1, "count": 250 } ],
    "currentPage": 0,
    "totalPages": 5,
    "totalElements": 50
  }
}
```

## Advanced Features
- **Intelligent Redundancy Filtering**: Removes child interests when parent is selected
- **Full Category Hierarchy**: Subcategories included via `CategoryService.getCategoryWithChildren()`
- **Batch Operations**: Efficient `saveAll()` / `deleteAll()` for bulk requests

## Bruno API Test Suite
Located under `Kaleidoscope-api-test/user-interests/`:
- Tests for single add/remove, bulk add/remove, retrieval, and analytics

## Features Implemented
✅ Constructor injection for services  
✅ `ApiResponse<T>` wrapper  
✅ Defined routes as constants  
✅ Pagination support  
✅ Swagger documentation  
✅ Validation with `@NotNull`, `@Positive`, `@NotEmpty`  
✅ Intelligent filtering and hierarchy loading  
✅ Bulk operation support  
✅ Admin analytics endpoint  

## Error Scenarios Handled
- Duplicate interest → 409 CONFLICT  
- Missing interest/category → 404 NOT_FOUND  
- Validation failures → 400 BAD_REQUEST  
- Unauthorized → 401 UNAUTHORIZED  
- Forbidden (admin-only) → 403 FORBIDDEN
