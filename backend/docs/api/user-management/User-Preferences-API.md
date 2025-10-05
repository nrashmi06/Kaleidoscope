# User Preferences API Documentation

## Overview
Manage user preferences for theme, language, privacy, and visibility settings. Provides endpoints to retrieve and update preferences for the authenticated user or, for admin roles, other users.

**Base URL**: `/api/user-preferences`

## Created Components

### 1. Routes (UserPreferencesRoutes.java)
- `GET_PREFERENCES`: GET `/api/user-preferences` (and `/{userId}`)
- `UPDATE_PREFERENCES`: PUT `/api/user-preferences`
- `UPDATE_THEME`: PATCH `/api/user-preferences/theme`
- `UPDATE_LANGUAGE`: PATCH `/api/user-preferences/language`
- `UPDATE_PRIVACY`: PATCH `/api/user-preferences/privacy`
- `UPDATE_VISIBILITY`: PATCH `/api/user-preferences/visibility`

### 2. DTOs
- **Request**: `UpdateUserPreferencesRequestDTO` (all fields required with validation), `UpdateThemeRequestDTO`, `UpdateLanguageRequestDTO`, `UpdatePrivacySettingsRequestDTO`, `UpdateVisibilitySettingsRequestDTO`
- **Response**: `UserPreferencesResponseDTO` (preferenceId, userId, all preference fields, timestamps)

### 3. Enums
- **Theme**: `LIGHT`, `DARK`
- **Visibility**: `PUBLIC`, `FRIENDS_ONLY`, `PRIVATE`

### 4. Features
- Complete user preference management for theme, language, and privacy settings
- Individual preference category updates via PATCH operations
- Bulk preference updates via PUT operation
- Current user and specific user ID support
- Comprehensive validation with custom messages

### 5. Security
- Authentication required for all operations (`@PreAuthorize("isAuthenticated()")`)
- Users can access their own preferences, service layer handles authorization for other user IDs

## API Endpoints

### 1. Get User Preferences

#### Get Current User Preferences
```
GET /api/user-preferences
Authorization: Bearer <accessToken>
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/user-preferences" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response**: `200 OK`
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

#### Get Specific User Preferences (Admin/Authorized)
```
GET /api/user-preferences/{userId}
Authorization: Bearer <accessToken>
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8080/kaleidoscope/api/user-preferences/42" \
  -H "Authorization: Bearer your-jwt-token"
```

**Response Structure** (`UserPreferencesResponseDTO`):
- `preferenceId`: Unique preference record ID
- `userId`: User ID these preferences belong to
- `theme`: User's theme preference (`Theme` enum: LIGHT, DARK)
- `language`: Language preference (format: `en-US`)
- **Visibility Settings** (`Visibility` enum: PUBLIC, FRIENDS_ONLY, PRIVATE):
  - `profileVisibility`: Profile visibility level
  - `allowMessages`: Who can send messages
  - `allowTagging`: Who can tag the user
  - `viewActivity`: Who can view user activity
- **Privacy Settings** (Boolean values):
  - `showEmail`: Whether to show email in profile
  - `showPhone`: Whether to show phone in profile
  - `showOnlineStatus`: Whether to show online status
  - `searchDiscoverable`: Whether profile appears in search
- `createdAt`/`updatedAt`: Timestamp tracking

### 2. Update All Preferences (Full Update)

#### Bulk Update All Preference Fields
```
PUT /api/user-preferences
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (`UpdateUserPreferencesRequestDTO`):
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

**cURL Example**:
```bash
curl -X PUT "http://localhost:8080/kaleidoscope/api/user-preferences" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "User preferences updated successfully",
  "data": {
    "preferenceId": 10,
    "userId": 42,
    "theme": "LIGHT",
    "language": "en-US",
    "profileVisibility": "PUBLIC",
    "allowMessages": "FRIENDS_ONLY",
    "allowTagging": "FRIENDS_ONLY",
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

**Request Fields** (`UpdateUserPreferencesRequestDTO` - **All Required with Validation**):
- `theme` (`@NotNull`): Theme preference (`Theme` enum)
- `language` (`@NotBlank`, `@Pattern`): Language in format `en-US`
- `profileVisibility` (`@NotNull`): Profile visibility (`Visibility` enum)
- `allowMessages` (`@NotNull`): Message permission (`Visibility` enum)
- `allowTagging` (`@NotNull`): Tagging permission (`Visibility` enum)
- `viewActivity` (`@NotNull`): Activity view permission (`Visibility` enum)
- `showEmail` (`@NotNull`): Show email in profile (Boolean)
- `showPhone` (`@NotNull`): Show phone in profile (Boolean)
- `showOnlineStatus` (`@NotNull`): Show online status (Boolean)
- `searchDiscoverable` (`@NotNull`): Discoverable in search (Boolean)

### 3. Update Theme Only

#### Update Theme Setting
```
PATCH /api/user-preferences/theme
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (`UpdateThemeRequestDTO`):
```json
{ "theme": "DARK" }
```

**cURL Example**:
```bash
curl -X PATCH "http://localhost:8080/kaleidoscope/api/user-preferences/theme" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{ "theme": "DARK" }'
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Theme updated successfully",
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
    "updatedAt": "2024-07-02T08:35:00Z"
  },
  "errors": [],
  "timestamp": 1625234724000,
  "path": "/api/user-preferences/theme"
}
```

### 4. Update Language Only

#### Update Language Setting
```
PATCH /api/user-preferences/language
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (`UpdateLanguageRequestDTO`):
```json
{ "language": "fr-FR" }
```

**cURL Example**:
```bash
curl -X PATCH "http://localhost:8080/kaleidoscope/api/user-preferences/language" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{ "language": "fr-FR" }'
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Language updated successfully",
  "data": {
    "preferenceId": 10,
    "userId": 42,
    "theme": "DARK",
    "language": "fr-FR",
    "profileVisibility": "FRIENDS_ONLY",
    "allowMessages": "PUBLIC",
    "allowTagging": "PUBLIC",
    "viewActivity": "PUBLIC",
    "showEmail": true,
    "showPhone": false,
    "showOnlineStatus": true,
    "searchDiscoverable": true,
    "createdAt": "2024-07-01T12:00:00Z",
    "updatedAt": "2024-07-02T08:40:00Z"
  },
  "errors": [],
  "timestamp": 1625234824000,
  "path": "/api/user-preferences/language"
}
```

**Validation**: Language must match pattern `^[a-z]{2}-[A-Z]{2}$` (e.g., `en-US`, `fr-FR`)

### 5. Update Privacy Settings Only

#### Update Privacy-Related Settings
```
PATCH /api/user-preferences/privacy
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (`UpdatePrivacySettingsRequestDTO`):
```json
{ 
  "showEmail": true, 
  "showPhone": false, 
  "showOnlineStatus": true, 
  "searchDiscoverable": false 
}
```

**cURL Example**:
```bash
curl -X PATCH "http://localhost:8080/kaleidoscope/api/user-preferences/privacy" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "showEmail": true,
    "showPhone": false,
    "showOnlineStatus": true,
    "searchDiscoverable": false
  }'
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Privacy settings updated successfully",
  "data": {
    "preferenceId": 10,
    "userId": 42,
    "theme": "DARK",
    "language": "fr-FR",
    "profileVisibility": "FRIENDS_ONLY",
    "allowMessages": "PUBLIC",
    "allowTagging": "PUBLIC",
    "viewActivity": "PUBLIC",
    "showEmail": true,
    "showPhone": false,
    "showOnlineStatus": true,
    "searchDiscoverable": false,
    "createdAt": "2024-07-01T12:00:00Z",
    "updatedAt": "2024-07-02T08:45:00Z"
  },
  "errors": [],
  "timestamp": 1625234924000,
  "path": "/api/user-preferences/privacy"
}
```

### 6. Update Visibility Settings Only

#### Update Visibility-Related Settings
```
PATCH /api/user-preferences/visibility
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (`UpdateVisibilitySettingsRequestDTO`):
```json
{ 
  "viewActivity": "PRIVATE", 
  "allowMessages": "PUBLIC", 
  "allowTagging": "PRIVATE" 
}
```

**cURL Example**:
```bash
curl -X PATCH "http://localhost:8080/kaleidoscope/api/user-preferences/visibility" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "viewActivity": "PRIVATE",
    "allowMessages": "PUBLIC",
    "allowTagging": "PRIVATE"
  }'
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Visibility settings updated successfully",
  "data": {
    "preferenceId": 10,
    "userId": 42,
    "theme": "DARK",
    "language": "fr-FR",
    "profileVisibility": "FRIENDS_ONLY",
    "allowMessages": "PUBLIC",
    "allowTagging": "PRIVATE",
    "viewActivity": "PRIVATE",
    "showEmail": true,
    "showPhone": false,
    "showOnlineStatus": true,
    "searchDiscoverable": false,
    "createdAt": "2024-07-01T12:00:00Z",
    "updatedAt": "2024-07-02T08:50:00Z"
  },
  "errors": [],
  "timestamp": 1625235024000,
  "path": "/api/user-preferences/visibility"
}
```

## Data Models

### Enums

#### Theme Enum
```java
public enum Theme {
    LIGHT,
    DARK
}
```

#### Visibility Enum
```java
public enum Visibility {
    PUBLIC,
    FRIENDS_ONLY,
    PRIVATE
}
```

### Request DTOs

#### UpdateUserPreferencesRequestDTO (Full Update)
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

#### UpdateThemeRequestDTO
```json
{ "theme": "DARK" }
```

#### UpdateLanguageRequestDTO
```json
{ "language": "fr-FR" }
```

#### UpdatePrivacySettingsRequestDTO
```json
{ 
  "showEmail": true, 
  "showPhone": false, 
  "showOnlineStatus": true, 
  "searchDiscoverable": false 
}
```

#### UpdateVisibilitySettingsRequestDTO
```json
{ 
  "viewActivity": "PRIVATE", 
  "allowMessages": "PUBLIC", 
  "allowTagging": "PRIVATE" 
}
```

### Response DTO

#### UserPreferencesResponseDTO
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

## Security & Authorization

### Authentication
- All endpoints require valid JWT token
- Uses `@PreAuthorize("isAuthenticated()")` for all operations

### Authorization
- Users can access their own preferences
- Service layer handles authorization checks for accessing other users' preferences
- Admin/authorized users can access preferences by userId

### Validation
- Full update requires all fields with comprehensive validation
- Individual updates validate only relevant fields
- Theme and Visibility fields use enum validation
- Language field uses regex pattern validation

## Error Response Format
All endpoints return standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": ["Specific error details"],
  "timestamp": 1625234523000,
  "path": "/api/user-preferences/{endpoint}"
}
```

### Status Codes
- **200 OK**: Successful operation
- **400 BAD_REQUEST**: Invalid input data or validation errors
- **401 UNAUTHORIZED**: Authentication required
- **403 FORBIDDEN**: Access denied for requested user ID
- **404 NOT_FOUND**: User preferences not found

## Service Implementation

### Key Methods (UserPreferencesService)
- `getUserPreferences()`: Get current user's preferences
- `getUserPreferencesByUserId(Long userId)`: Get specific user's preferences (with authorization)
- `updateUserPreferences(UpdateUserPreferencesRequestDTO)`: Full update
- `updateTheme(UpdateThemeRequestDTO)`: Theme-only update
- `updateLanguage(UpdateLanguageRequestDTO)`: Language-only update
- `updatePrivacySettings(UpdatePrivacySettingsRequestDTO)`: Privacy settings update
- `updateVisibilitySettings(UpdateVisibilitySettingsRequestDTO)`: Visibility settings update

### Controller Implementation (UserPreferencesController)
- Implements `UserPreferencesApi` interface for Swagger documentation
- Supports both current user and specific user ID access patterns
- Uses `@Valid` for request validation
- Returns standardized `ApiResponse<T>` wrapper
- Handles optional path variable for userId in GET endpoint

## Bruno API Test Suite
Located under `Kaleidoscope-api-test/user-preferences/`:
- Get current user preferences
- Get specific user preferences
- Full update preferences
- Update theme only
- Update language only
- Update privacy settings
- Update visibility settings

## Features Implemented
✅ Complete user preference management (theme, language, privacy, visibility)  
✅ Full update with comprehensive validation  
✅ Individual preference category updates via PATCH operations  
✅ Current user and specific user ID support  
✅ Enum-based theme and visibility settings  
✅ Language format validation with regex pattern  
✅ Privacy settings for email, phone, online status, and search discoverability  
✅ Swagger documentation via UserPreferencesApi interface  
✅ Context path support (/kaleidoscope)

## Notes
- All endpoints require authentication
- DTO field validations apply with custom error messages
- Service layer enforces authorization for user ID parameter access
- Language must follow format: `en-US`, `fr-FR`, etc.
- Theme supports LIGHT and DARK modes
- Visibility levels: PUBLIC, FRIENDS_ONLY, PRIVATE
