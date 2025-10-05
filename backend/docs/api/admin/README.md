# Admin APIs

## Overview
Administrative control center for the Kaleidoscope platform, providing comprehensive oversight, analytics, and management capabilities for system administrators.

## API Categories

### User Administration
- User account status management (ACTIVE, SUSPENDED, DEACTIVATED)
- User search and filtering with pagination
- Profile oversight and management
- Account verification and moderation

### System Analytics
- User interest analytics by category
- Platform usage statistics
- Content engagement metrics
- Community safety insights

### Content Moderation
- User blocking oversight and management
- Community safety monitoring
- Content policy enforcement
- Relationship management controls

### Administrative Oversight
- Notification preference management (all users)
- Category management and hierarchy control
- System-wide configuration and monitoring
- Bulk administrative operations

## Admin-Only Endpoints
The following endpoints require `ROLE_ADMIN` authorization:

### From User Management
- `PUT /api/users/profile-status` - Update user account status
- `GET /api/users` - Search and filter all users

### From Social Features
- `GET /api/user-blocks/admin/all` - View all user blocks
- `DELETE /api/user-blocks/admin/remove` - Remove specific blocks

### From User Interests
- `GET /api/users/interests/user/{userId}` - View user's interests
- `GET /api/users/interests/admin/category-analytics` - Category statistics

### From Notification Preferences
- `GET /api/user-notification-preferences/admin/all` - View all user preferences

### From Content Management
- `POST /api/categories` - Create categories
- `PUT /api/categories/{categoryId}` - Update categories
- `DELETE /api/categories/{categoryId}` - Delete categories

## Key Features
- **Role-Based Access**: All admin endpoints require `ROLE_ADMIN`
- **Comprehensive Oversight**: Full platform monitoring capabilities
- **Safety Controls**: Community safety and moderation tools
- **Analytics**: Platform insights and usage statistics
- **Bulk Operations**: Efficient administrative management

## Security
- JWT authentication required
- Admin role validation (`@PreAuthorize("hasRole('ROLE_ADMIN')")`)
- Audit logging for administrative actions
- Secure administrative controls

## Related Bruno Tests
Admin endpoints are tested across various test collections with admin role validation.
