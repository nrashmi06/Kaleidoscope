# Kaleidoscope API Documentation Overview

## About Kaleidoscope
Kaleidoscope is an enterprise photo-sharing platform designed to foster cultural connection and community building among employees across different geographic locations.

**API Base URL**: `http://localhost:8080/kaleidoscope`  
**Production URL**: `https://api.kaleidoscope.com/kaleidoscope`

## API Architecture

### Technology Stack
- **Backend**: Spring Boot 3.4.5 with Java 21
- **Database**: PostgreSQL (primary), Redis (caching/streaming), Elasticsearch (search)
- **Authentication**: JWT with HTTP-only refresh token cookies
- **Documentation**: SpringDoc OpenAPI 3 (Swagger)
- **API Testing**: Bruno HTTP Client

### Response Format
All API endpoints return standardized responses using `ApiResponse<T>` wrapper:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* Response data */ },
  "errors": [],
  "timestamp": 1751455561337,
  "path": "/api/endpoint"
}
```

### Pagination
Paginated endpoints use `PaginatedResponse<T>` structure:

```json
{
  "content": [/* Array of items */],
  "totalElements": 100,
  "totalPages": 10,
  "currentPage": 0,
  "pageSize": 10,
  "hasNext": true,
  "hasPrevious": false,
  "isFirst": true,
  "isLast": false
}
```

### Authentication
- **Access Tokens**: Short-lived JWT tokens for API authentication
- **Refresh Tokens**: Long-lived HTTP-only cookies for token renewal
- **Authorization Header**: `Authorization: Bearer <access_token>`

### Security Roles
- **USER**: Standard authenticated user
- **ADMIN**: Administrative privileges
- **MODERATOR**: Content moderation capabilities

## API Documentation Structure

### 🔐 Authentication APIs
**Location**: `/api/authentication/`
- User registration and verification
- Login/logout functionality
- Password management (forgot/reset/change)
- Token renewal and validation
- Username availability checking

### 👤 User Management APIs
**Location**: `/api/user-management/`
- User profile management
- User preferences (theme, privacy settings)
- User notification preferences
- User interests and category management
- Account status management (admin)

### 🤝 Social Features APIs
**Location**: `/api/social-features/`
- Follow/unfollow functionality
- User blocking system
- Social relationship management
- Activity visibility controls

### 📋 Content Management APIs
**Location**: `/api/content-management/`
- Category hierarchy management
- Content organization and tagging
- Admin content controls

### 📸 Posts APIs
**Location**: `/api/posts/`
- Post CRUD (create, read, update, delete)
- Post interactions (reactions, comments, comment reactions)
- Post save/unsave (bookmarking)
- Post suggestions (personalized feed)
- Post search and filtering

### 📝 Blog APIs
**Location**: `/api/blogs/`
- Blog CRUD with approval workflow
- Blog interactions (reactions, comments, comment reactions)
- Blog save/unsave (bookmarking)
- Blog suggestions (personalized feed)
- Blog status management (admin)
- Blog search and filtering

### 🔔 Notification APIs
**Location**: `/api/notifications/`
- In-app notifications (list, mark as read, delete)
- Real-time notifications via SSE stream
- Unread notification count

### #️⃣ Hashtag APIs
**Location**: `/api/hashtags/`
- Trending hashtags
- Hashtag autocomplete suggestions
- Hashtag details

### 📍 Location APIs
**Location**: `/api/locations/`
- Location search and CRUD
- Geographic location management

### 🏷️ User Tag APIs
**Location**: `/api/user-tags/`
- Tag users in posts and blogs
- Search taggable users
- Manage content tags

### 🔧 Admin APIs
**Location**: `/api/admin/`
- User administration
- System analytics
- Content moderation
- Administrative oversight

## Getting Started

### 1. Authentication Flow
1. **Register**: Create account with email verification
2. **Login**: Authenticate and receive access token + refresh cookie
3. **Access APIs**: Use Bearer token in Authorization header
4. **Refresh**: Renew access token using refresh cookie
5. **Logout**: Invalidate tokens and clear session

### 2. Common Patterns
- **Pagination**: Use `?page=0&size=10&sort=field,direction`
- **Filtering**: Use query parameters for filtering data
- **Bulk Operations**: Available for efficient multi-item operations
- **File Uploads**: Multipart form data with validation

### 3. Error Handling
- **400 Bad Request**: Invalid input or validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server-side errors

## API Testing

### Bruno HTTP Client
Complete API test suite available in `/Kaleidoscope-api-test/`:
- Organized by feature modules
- Environment configurations (development/production)
- Authentication token management
- Comprehensive test scenarios

### Swagger UI
Interactive API documentation available at:
- **Development**: `http://localhost:8080/kaleidoscope/swagger-ui.html`
- **OpenAPI Spec**: `http://localhost:8080/kaleidoscope/api-docs`

## Development Guidelines

### API Design Principles
- RESTful architecture with standard HTTP methods
- Consistent response formats across all endpoints
- Comprehensive input validation with meaningful error messages
- Role-based access control for security
- Pagination for large data sets

### Best Practices
- Use appropriate HTTP status codes
- Include meaningful error messages
- Implement proper authentication and authorization
- Follow consistent naming conventions
- Document all endpoints thoroughly

### Performance Considerations
- Caching strategies with Redis
- Database optimization with proper indexing
- Pagination for large datasets
- Efficient query patterns
- File upload optimization

## Support and Contact

For API support, development questions, or feature requests:
- **Documentation Issues**: Check individual API documentation files
- **Testing**: Use Bruno collection for comprehensive API testing
- **Development Environment**: Ensure proper configuration of database and Redis

---

**Last Updated**: February 2026  
**API Version**: 1.0.0  
**Documentation Version**: 2.0.0
