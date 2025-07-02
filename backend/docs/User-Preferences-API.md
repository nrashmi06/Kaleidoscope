# User Preferences API Documentation

## Overview
Manage user preferences for theme, language, privacy, and visibility settings. Provides endpoints to retrieve and update preferences for the authenticated user or, for admin roles, other users.

**Base URL**: `/api/user-preferences`

## Routes
| Method | Path                                | Description                                    |
|--------|-------------------------------------|------------------------------------------------|
| GET    | `/api/user-preferences`             | Get current user preferences                   |
| GET    | `/api/user-preferences/{userId}`    | Get preferences by user ID                     |
| PUT    | `/api/user-preferences`             | Update all preferences (bulk)                  |
| PATCH  | `/api/user-preferences/theme`       | Update theme setting                           |
| PATCH  | `/api/user-preferences/language`    | Update language setting                        |
| PATCH  | `/api/user-preferences/privacy`     | Update privacy-related settings                |
| PATCH  | `/api/user-preferences/visibility`  | Update visibility-related settings             |

## Data Models

### UpdateUserPreferencesRequestDTO
```json
{
  "theme": "LIGHT",
  "language": "en-US",
  "profileVisibility": "PUBLIC",
  "allowMessages": "FRIENDS_ONLY",
  "allowTagging": "FRIENDS_ONLY",
  "viewActivity": "PUBLIC",
  "showEmail": true,
  "showPhone": false,
  "showOnlineStatus": true,
  "searchDiscoverable": true
}
```

### UpdateThemeRequestDTO
```json
{ "theme": "DARK" }
```

### UpdateLanguageRequestDTO
```json
{ "language": "fr-FR" }
```

### UpdatePrivacySettingsRequestDTO
```json
{ "showEmail": true, "showPhone": false, "showOnlineStatus": true, "searchDiscoverable": false }
```

### UpdateVisibilitySettingsRequestDTO
```json
{ "viewActivity": "PRIVATE", "allowMessages": "PUBLIC", "allowTagging": "PRIVATE" }
```

### UserPreferencesResponseDTO
```json
{
  "preferenceId": 10,
  "userId": 42,
  "theme": "DARK",
  "language": "en-US",
  "profileVisibility": "FRIENDS_ONLY",
  "allowMessages": "PUBLIC",
  "allowTagging": "PUBLIC",
  "viewActivity": "PUBLIC",
  "showEmail": true,
  "showPhone": false,
  "showOnlineStatus": true,
  "searchDiscoverable": true,
  "createdAt": "2024-07-01T12:00:00Z",
  "updatedAt": "2024-07-02T08:30:00Z"
}
```

## Endpoints

### 1. Get User Preferences
Retrieve preferences for the authenticated user or by user ID.

Request:
```
GET /api/user-preferences
Authorization: Bearer <token>
```

Optional:
```
GET /api/user-preferences/{userId}
```

Response: `200 OK`
```json
{
  "success": true,
  "message": "User preferences retrieved successfully",
  "data": {
    "preferenceId": 10,
    "userId": 42,
    "theme": "DARK",
    "language": "en-US",
    "profileVisibility": "FRIENDS_ONLY",
    "allowMessages": "PUBLIC",
    "allowTagging": "PUBLIC",
    "viewActivity": "PUBLIC",
    "showEmail": true,
    "showPhone": false,
    "showOnlineStatus": true,
    "searchDiscoverable": true,
    "createdAt": "2024-07-01T12:00:00Z",
    "updatedAt": "2024-07-02T08:30:00Z"
  },
  "errors": [],
  "timestamp": 1625234523000,
  "path": "/api/user-preferences"
}
```

### 2. Update All Preferences
Bulk update all preference fields for the authenticated user.

Request:
```
PUT /api/user-preferences
Authorization: Bearer <token>
Content-Type: application/json
```
Body:
```json
{
  "theme": "LIGHT",
  "language": "en-US",
  "profileVisibility": "PUBLIC",
  "allowMessages": "FRIENDS_ONLY",
  "allowTagging": "FRIENDS_ONLY",
  "viewActivity": "PUBLIC",
  "showEmail": true,
  "showPhone": false,
  "showOnlineStatus": true,
  "searchDiscoverable": true
}
```

Response: `200 OK`
```json
{
  "success": true,
  "message": "User preferences updated successfully",
  "data": {
    "preferenceId": 10,
    "userId": 42,
    "theme": "DARK",
    "language": "en-US",
    "profileVisibility": "FRIENDS_ONLY",
    "allowMessages": "PUBLIC",
    "allowTagging": "PUBLIC",
    "viewActivity": "PUBLIC",
    "showEmail": true,
    "showPhone": false,
    "showOnlineStatus": true,
    "searchDiscoverable": true,
    "createdAt": "2024-07-01T12:00:00Z",
    "updatedAt": "2024-07-02T08:30:00Z"
  },
  "errors": [],
  "timestamp": 1625234624000,
  "path": "/api/user-preferences"
}
```

### 3. Update Theme Only

Request:
```
PATCH /api/user-preferences/theme
Authorization: Bearer <token>
Content-Type: application/json
```
Body:
```json
{ "theme": "DARK" }
```

Response: `200 OK`

### 4. Update Language Only

Request:
```
PATCH /api/user-preferences/language
Authorization: Bearer <token>
Content-Type: application/json
```
Body:
```json
{ "language": "fr-FR" }
```

Response: `200 OK`

### 5. Update Privacy Settings Only

Request:
```
PATCH /api/user-preferences/privacy
Authorization: Bearer <token>
Content-Type: application/json
```
Body:
```json
{ "showEmail": true, "showPhone": false, "showOnlineStatus": true, "searchDiscoverable": false }
```

Response: `200 OK`

### 6. Update Visibility Settings Only

Request:
```
PATCH /api/user-preferences/visibility
Authorization: Bearer <token>
Content-Type: application/json
```
Body:
```json
{ "viewActivity": "PRIVATE", "allowMessages": "PUBLIC", "allowTagging": "PRIVATE" }
```

Response: `200 OK`

## Notes
- All endpoints require authentication.
- DTO field validations apply (see annotations in code).
- Service layer enforces authorization for user ID parameter.
