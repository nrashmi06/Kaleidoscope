# UserInterest API Endpoints

## Overview
Complete implementation of UserInterest management API endpoints following the existing project patterns. This includes advanced features like bulk operations, intelligent redundancy filtering, and comprehensive API testing.

## Created Components

### 1. Routes (UserInterestRoutes.java)
- `ADD_USER_INTEREST`: POST `/api/users/interests`
- `ADD_USER_INTERESTS_BULK`: POST `/api/users/interests/bulk`
- `REMOVE_USER_INTEREST`: DELETE `/api/users/interests/{categoryId}`
- `REMOVE_USER_INTERESTS_BULK`: DELETE `/api/users/interests/bulk`
- `GET_USER_INTERESTS`: GET `/api/users/interests`
- `GET_USER_INTERESTS_BY_USER_ID`: GET `/api/users/interests/user/{userId}`
- `ADMIN_GET_ALL_USER_INTERESTS`: GET `/api/users/interests/admin/all`

### 2. DTOs
- **Request**: `AddUserInterestRequestDTO` - Contains categoryId with enhanced validation (@NotNull, @Positive)
- **Bulk Request**: `BulkUserInterestRequestDTO` - Contains list of categoryIds with comprehensive validation
- **Response**: `UserInterestResponseDTO` - Contains interest details with full category hierarchy
- **List Response**: `UserInterestListResponseDTO` - Paginated response with metadata

### 3. Enhanced Validation
- `@NotNull` - Ensures categoryId is provided
- `@Positive` - Ensures categoryId is a positive number
- `@NotEmpty` - Ensures bulk operations have at least one category
- List validation for bulk operations with individual item validation

### 4. Custom Exceptions
- `UserInterestNotFoundException` - 404 when interest not found
- `UserInterestAlreadyExistsException` - 409 when trying to add duplicate interest

### 5. Repository (UserInterestRepository.java)
- `findByUser_UserIdAndCategory_CategoryId` - Find specific user interest
- `findByUser_UserId` - Get all interests for a user (paginated)
- `existsByUser_UserIdAndCategory_CategoryId` - Check if interest exists (optimized)
- `findByUser_UserIdAndCategory_CategoryIdIn` - Bulk operations support

### 6. Service Layer Enhancements
- **Interface**: `UserInterestService` with comprehensive documentation including bulk operations
- **Implementation**: `UserInterestServiceImpl` with:
  - Proper transaction handling
  - Performance optimizations (using `exists` instead of `find` for duplicate checking)
  - Intelligent redundancy filtering
  - Bulk operation support with batch processing
  - Efficient duplicate filtering for bulk operations

### 7. Controller (UserInterestController.java)
- Uses `@RequiredArgsConstructor` for dependency injection
- All endpoints return `ApiResponse<T>` wrapper
- Comprehensive Swagger documentation for all endpoints including bulk operations
- Security annotations at method level
- Admin endpoint requires `ROLE_ADMIN`
- Bulk operation endpoints with proper validation

### 8. Intelligent Category Hierarchy Management
- **Full Subcategory Loading**: Categories now include complete subcategory hierarchies
- **Redundancy Filtering**: Automatically filters out child category interests when parent is already included
- **Performance Optimization**: Uses CategoryService.getCategoryWithChildren() for proper hierarchy loading

### 9. Exception Handling
- Updated `UserExceptionHandler` with new exception handlers
- Proper HTTP status codes (404, 409)
- Consistent error response format

## API Endpoints

### Add Single User Interest
```
POST /api/users/interests
Authorization: Bearer token required
Content-Type: application/json

Body: 
{
  "categoryId": 123
}

Response: 200 OK
{
  "success": true,
  "message": "Interest added successfully",
  "data": null,
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/users/interests"
}
```

### Add Multiple User Interests (Bulk)
```
POST /api/users/interests/bulk
Authorization: Bearer token required
Content-Type: application/json

Body: 
{
  "categoryIds": [1, 2, 3, 4, 5]
}

Response: 200 OK
{
  "success": true,
  "message": "Interests added successfully",
  "data": null,
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/users/interests/bulk"
}
```

### Remove Single User Interest
```
DELETE /api/users/interests/{categoryId}
Authorization: Bearer token required

Response: 200 OK
{
  "success": true,
  "message": "Interest removed successfully",
  "data": null,
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/users/interests/{categoryId}"
}
```

### Remove Multiple User Interests (Bulk)
```
DELETE /api/users/interests/bulk
Authorization: Bearer token required
Content-Type: application/json

Body: 
{
  "categoryIds": [1, 2, 3]
}

Response: 200 OK
{
  "success": true,
  "message": "Interests removed successfully",
  "data": null,
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/users/interests/bulk"
}
```

### Get Current User's Interests (With Intelligent Filtering)
```
GET /api/users/interests?page=0&size=10&sort=createdAt,desc
Authorization: Bearer token required

Response: 200 OK
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
          "description": "Tech related content",
          "iconName": "tech-icon",
          "parentId": null,
          "subcategories": [
            {
              "categoryId": 2,
              "name": "AI",
              "description": "Artificial Intelligence",
              "iconName": "ai-icon",
              "parentId": 1,
              "subcategories": []
            }
          ]
        },
        "createdAt": "2025-07-02T16:55:54.48747"
      }
    ],
    "currentPage": 0,
    "totalPages": 1,
    "totalElements": 1
  },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/users/interests"
}
```

### Get User Interests by User ID
```
GET /api/users/interests/user/{userId}?page=0&size=10
Authorization: Bearer token required
Response: Paginated list of user interests with full category hierarchy
```

### Admin: Get All User Interests
```
GET /api/users/interests/admin/all?page=0&size=10
Authorization: Bearer token required (ADMIN role)
Response: Paginated list of all user interests (no filtering applied)
```

## Advanced Features

### 1. Intelligent Redundancy Filtering
- **Problem Solved**: Prevents showing both parent and child categories as separate interests
- **How it works**: When a user has interests in both "Technology" and "AI" (child of Technology), only "Technology" is shown with "AI" as a subcategory
- **Benefits**: Cleaner UI, no duplicate information, better user experience

### 2. Bulk Operations
- **Add Multiple Interests**: Single API call to add multiple categories
- **Remove Multiple Interests**: Single API call to remove multiple categories
- **Performance**: Batch database operations for better efficiency
- **Validation**: Comprehensive validation for each category ID in the list

### 3. Enhanced Category Hierarchy
- **Full Subcategory Loading**: Each category includes its complete subcategory tree
- **Optimized Loading**: Uses CategoryService.getCategoryWithChildren() for proper hierarchy building
- **Consistent Structure**: All endpoints return the same rich category structure

### 4. Performance Optimizations
- **Efficient Duplicate Checking**: Uses `existsByUser_UserIdAndCategory_CategoryId` instead of fetching full entities
- **Batch Operations**: saveAll() and deleteAll() for bulk operations
- **Smart Filtering**: Pre-filters existing interests before bulk operations

## Bruno API Test Suite

Complete Bruno API test collection created in `Kaleidoscope-api-test/user-interests/`:

1. **folder.bru** - Collection configuration
2. **add user interest.bru** - Test single interest addition
3. **add user interests bulk.bru** - Test bulk interest addition
4. **remove user interest.bru** - Test single interest removal
5. **remove user interests bulk.bru** - Test bulk interest removal
6. **get user interests.bru** - Test user's interests retrieval with pagination
7. **get user interests by user id.bru** - Test viewing other user's interests
8. **admin get all user interests.bru** - Test admin endpoint

### Bruno Test Features:
- Environment variables for base URL and tokens
- Comprehensive response validation
- Pagination parameter testing
- Authentication testing for all endpoints
- Admin role testing for admin endpoints

## Features Implemented
✅ Constructor injection for services  
✅ ApiResponse<T> wrapper for all endpoints  
✅ Routes defined as constants  
✅ Pagination support with Pageable  
✅ Enhanced mapper with category hierarchy loading  
✅ Custom exception handling  
✅ Security annotations at method level  
✅ Comprehensive Swagger documentation  
✅ Proper transaction handling  
✅ Enhanced validation with @Positive and bulk validation  
✅ **NEW**: Bulk operations for add/remove multiple interests  
✅ **NEW**: Intelligent redundancy filtering  
✅ **NEW**: Full category hierarchy with subcategories  
✅ **NEW**: Performance optimizations  
✅ **NEW**: Complete Bruno API test suite  

## Error Scenarios Handled
- User tries to add duplicate interest → 409 CONFLICT
- User tries to remove non-existent interest → 404 NOT_FOUND
- Category not found → 404 NOT_FOUND (from CategoryService)
- User not found → 404 NOT_FOUND (from UserService)
- Unauthorized access → 401 UNAUTHORIZED
- Admin endpoints without proper role → 403 FORBIDDEN
- **NEW**: Invalid category ID (negative numbers) → 400 BAD_REQUEST
- **NEW**: Empty bulk operation lists → 400 BAD_REQUEST
- **NEW**: Null values in bulk operation lists → 400 BAD_REQUEST

## Recent Improvements and Bug Fixes

### 1. Fixed Subcategory Loading Issue
- **Problem**: Categories were showing empty subcategories arrays
- **Solution**: Updated UserInterestMapper to use CategoryService.getCategoryWithChildren()
- **Result**: Categories now show complete subcategory hierarchies

### 2. Implemented Redundancy Filtering
- **Problem**: Users seeing duplicate categories (parent + children as separate interests)
- **Solution**: Added intelligent filtering logic in service layer
- **Result**: Clean, non-redundant interest lists while preserving hierarchy information

### 3. Added Bulk Operations
- **Enhancement**: Support for adding/removing multiple interests in single API calls
- **Benefits**: Better performance, improved user experience for onboarding flows
- **Implementation**: Efficient batch processing with proper validation

### 4. Enhanced Validation
- **Improvement**: Added @Positive validation for category IDs
- **Enhancement**: Comprehensive validation for bulk operations
- **Result**: Better input validation and clearer error messages

### 5. Performance Optimizations
- **Database**: Using exists() methods instead of find() for duplicate checking
- **Bulk Operations**: Batch database operations using saveAll()/deleteAll()
- **Filtering**: Efficient set-based filtering for redundancy removal
