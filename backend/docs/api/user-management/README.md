# User Management APIs

## Overview
Comprehensive user profile and preference management system for the Kaleidoscope platform, including personal settings, interests, and notification controls.

## API Categories

### User Profile Management
- Profile updates with file upload support
- Account status management (admin)
- User search and filtering (admin)

### User Preferences
- Theme settings (LIGHT/DARK)
- Language preferences
- Privacy controls (email, phone visibility)
- Activity visibility settings

### Notification Preferences
- Email notification controls
- Push notification settings
- Category-specific preferences (likes, comments, follows, mentions, system)
- Bulk preference management

### User Interests
- Category interest management
- Bulk add/remove operations
- Interest analytics (admin)
- Personalization support

## Documentation Files
- [**User Management**](User-Management-API.md) - Profile management and admin controls
- [**User Preferences**](User-Preferences-API.md) - Theme, language, and privacy settings
- [**User Notification Preferences**](User-Notification-Preferences-API.md) - Notification controls
- [**User Interests**](UserInterest-API.md) - Category interest management

## Related Bruno Tests
Located in `/Kaleidoscope-api-test/`:
- `/users/` - User profile management
- `/user-preferences/` - Preference settings
- `/user-notification-preferences/` - Notification controls
- `/user-interests/` - Interest management
