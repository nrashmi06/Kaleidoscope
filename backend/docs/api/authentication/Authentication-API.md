# Authentication API Documentation

## Overview
Comprehensive authentication and authorization system for the Kaleidoscope application. Supports user registration, email verification, login, JWT access token issuance and renewal, password management, logout, and username availability checking.

**Base URL**: `/api/auth`

## Created Components

### 1. Routes (AuthRoutes.java)
- `REGISTER`                    : POST   `/api/auth/register`
- `LOGIN`                       : POST   `/api/auth/login`
- `LOGOUT`                      : POST   `/api/auth/logout`
- `RENEW_TOKEN`                 : POST   `/api/auth/renew-token`
- `VERIFY_EMAIL`                : POST   `/api/auth/verify-email` (Send verification email)
- `CHECK_USERNAME_AVAILABILITY` : GET    `/api/auth/check-username?username={username}`
- `RESEND_VERIFICATION_EMAIL`   : POST   `/api/auth/resend-verification-email`
- `FORGOT_PASSWORD`             : POST   `/api/auth/forgot-password`
- `RESET_PASSWORD`              : POST   `/api/auth/reset-password`
- `CHANGE_PASSWORD`             : PUT    `/api/auth/change-password`

### 2. DTOs
- **Request**
  - `UserRegistrationRequestDTO` (email, password, username, designation, summary, profilePicture as MultipartFile)
  - `UserLoginRequestDTO`       (email, password)
  - `ChangePasswordRequestDTO`  (oldPassword, newPassword)
  - `ResetPasswordRequestDTO`   (token, newPassword)
  - `VerifyEmailRequestDTO`     (email)
- **Response**
  - `UserRegistrationResponseDTO` (id, email, username, designation, summary, profilePictureUrl, enabled, createdAt)
  - `UserLoginResponseDTO`        (accessToken, refreshToken, tokenType, expiresIn, user details)
  - `UsernameAvailabilityResponseDTO` (username, available)
  - Standard `ApiResponse<T>` wrapper for all responses

### 3. Service Layer (AuthService)
Interface methods:
- `registerUser(UserRegistrationRequestDTO)`
- `sendVerificationEmail(String email)`
- `loginUser(UserLoginRequestDTO)`
- `forgotPassword(String email)`
- `resetPassword(String token, String newPassword)`
- `changePasswordById(Long userId, String oldPassword, String newPassword)`
- `checkUsernameAvailability(String username)`
- `clearCookies(HttpServletResponse response, String baseUrl)`

Implementation handles validation, email sending, JWT creation, refresh token persistence, and password encoding.

### 4. Controller (AuthController.java)
- Annotated with `@RestController`, implements `AuthApi`
- Endpoints use `@PostMapping`, `@GetMapping`, `@PutMapping`
- All responses wrapped in `ApiResponse<T>`
- Swagger annotations for docs via AuthApi interface
- Security: open endpoints for register, verify, login, forgot/reset, check-username; secured for change-password

### 5. Model
- `User` entity: id, email, password, username, enabled, roles, createdAt
- `RefreshToken` entity: id, user, token, expiryDate

### 6. Exceptions
- `UserAlreadyExistsException` → 409 Conflict
- `InvalidTokenException` → 400 Bad Request
- `ResourceNotFoundException` → 404 Not Found
- `AuthenticationException` → 401 Unauthorized
- `ValidationException` → 400 Bad Request
- `MissingRequestCookieException` → 400 Bad Request

### 7. Security
- JWT-based authentication with `JwtUtils`
- Access token (short-lived), refresh token (long-lived)
- Passwords hashed with `BCryptPasswordEncoder`
- Method-level security with `@PreAuthorize`
- HTTP-only cookies for refresh tokens

## API Endpoints

### 1. Register User
```
POST /api/auth/register
Content-Type: multipart/form-data
```
**Body** (Form Data):
- `userData` (JSON): User registration data
- `profilePicture` (File, optional): Profile picture file

**userData JSON structure** (`UserRegistrationRequestDTO`):
```json
{
  "email": "jane.doe@example.com",
  "username": "janedoe", 
  "password": "P@ssw0rd!",
  "designation": "Software Developer",
  "summary": "Passionate developer with 5 years of experience"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8080/kaleidoscope/api/auth/register \
  -F 'userData={"email":"jane.doe@example.com","username":"janedoe","password":"P@ssw0rd!","designation":"Software Developer","summary":"Passionate developer"}' \
  -F 'profilePicture=@/path/to/profile.jpg'
```

**Response**: `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "path": "/api/auth/register",
  "timestamp": "2025-07-02T10:00:00Z",
  "data": {
    "id": 1,
    "email": "jane.doe@example.com",
    "username": "janedoe",
    "designation": "Software Developer",
    "summary": "Passionate developer with 5 years of experience",
    "profilePictureUrl": "https://your-cdn.com/profiles/generated-filename.jpg",
    "enabled": false,
    "createdAt": "2025-07-02T10:00:00Z"
  },
  "errors": []
}
```
**Errors**:
- `400 BAD_REQUEST` on invalid input
- `409 CONFLICT` if email or username already in use

### 2. Send Verification Email
```
POST /api/auth/verify-email
Content-Type: application/json
```
**Body** (`VerifyEmailRequestDTO`):
```json
{
  "email": "jane.doe@example.com"
}
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Verification email sent successfully",
  "path": "/api/auth/verify-email",
  "timestamp": "2025-07-02T10:05:00Z",
  "data": "Verification email sent successfully",
  "errors": []
}
```
**Errors**:
- `400 BAD_REQUEST` if email invalid
- `404 NOT_FOUND` if user not found

### 3. Check Username Availability
```
GET /api/auth/check-username?username={username}
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Username is available",
  "path": "/api/auth/check-username",
  "timestamp": "2025-07-02T10:03:00Z",
  "data": {
    "username": "janedoe",
    "available": true
  },
  "errors": []
}
```

### 4. Login
```
POST /api/auth/login
Content-Type: application/json
```
**Body** (`UserLoginRequestDTO`):
```json
{ "email": "jane.doe@example.com", "password": "P@ssw0rd!" }
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "path": "/api/auth/login",
  "timestamp": "2025-07-02T10:10:00Z",
  "data": {
    "accessToken": "eyJhbGciOiJI...",
    "refreshToken": "dGhpc2lscmVmdXJ...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "email": "jane.doe@example.com",
      "username": "janedoe"
    }
  },
  "errors": []
}
```
**Note**: Refresh token is also set as HTTP-only cookie
**Errors**:
- `401 UNAUTHORIZED` on invalid credentials
- `403 FORBIDDEN` if email not verified

### 5. Renew Token
```
POST /api/auth/renew-token
Cookie: refreshToken=dGhpc2lscmVmdXJ...
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Token renewed successfully",
  "path": "/api/auth/renew-token",
  "timestamp": "2025-07-02T10:15:00Z",
  "data": {
    "accessToken": "newAccessToken...",
    "refreshToken": "newRefreshToken...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "email": "jane.doe@example.com",
      "username": "janedoe"
    }
  },
  "errors": []
}
```
**Errors**:
- `400 BAD_REQUEST` if refresh token cookie missing
- `401 UNAUTHORIZED` if refresh token invalid or expired

### 6. Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json
```
**Body** (`VerifyEmailRequestDTO`):
```json
{ "email": "jane.doe@example.com" }
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Email sent",
  "path": "/api/auth/forgot-password",
  "timestamp": "2025-07-02T10:20:00Z",
  "data": "Password reset email sent successfully"
}
```

### 7. Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json
```
**Body** (`ResetPasswordRequestDTO`):
```json
{ "token": "resetToken...", "newPassword": "NewP@ss1" }
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Password reset",
  "path": "/api/auth/reset-password",
  "timestamp": "2025-07-02T10:25:00Z",
  "data": "Password has been reset successfully"
}
```
**Errors**:
- `400 BAD_REQUEST` for invalid or expired reset token

### 8. Change Password
```
PUT /api/auth/change-password
Content-Type: application/json
Authorization: Bearer <accessToken>
```
**Body** (`ChangePasswordRequestDTO`):
```json
{ "oldPassword": "P@ssw0rd!", "newPassword": "N3wP@ss!" }
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Password updated",
  "path": "/api/auth/change-password",
  "timestamp": "2025-07-02T10:30:00Z",
  "data": "Password changed successfully"
}
```

### 9. Logout
```
POST /api/auth/logout
Content-Type: application/json
Authorization: Bearer <accessToken> (optional)
Cookie: refreshToken=... (optional)
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Logout successful",
  "path": "/api/auth/logout",
  "timestamp": "2025-07-02T10:35:00Z",
  "data": "User logged out successfully"
}
```

## Error Response Format
All endpoints return standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "path": "/api/auth/{endpoint}",
  "timestamp": "2025-07-02T10:00:00Z",
  "error": "Error type",
  "status": 400
}
```

## Authentication Flow
1. **Registration** → User signs up and receives email verification link.  
2. **Email Verification** → User requests verification email via `/verify-email` endpoint.  
3. **Login** → Authenticates and issues JWT access token + HTTP-only refresh token cookie.  
4. **Token Renewal** → Uses refresh token cookie to get new access token.  
5. **Password Management** → Forgot/reset and change-password for account security.  
6. **Logout** → Revokes refresh token and clears security context.

## Bruno API Test Suite
Located under `Kaleidoscope-api-test/auth/`:
- `register.bru`, `verify-email.bru`, `login.bru`, `renew token.bru`, `forgot password.bru`, `reset password.bru`, `change password.bru`, `logout.bru`, `check username availability.bru`.

## Features Implemented
✅ User registration with email confirmation  
✅ JWT access and HTTP-only refresh token cookie management  
✅ Email verification workflow via POST endpoint  
✅ Username availability checking  
✅ Password reset and change endpoints  
✅ Logout with refresh token revoke  
✅ Comprehensive Swagger documentation via AuthApi interface  
✅ Validation annotations on DTOs  
✅ Custom exception handling  
✅ Secure password hashing with BCrypt  
✅ Context path support (/kaleidoscope)

## Error Scenarios Handled
- Duplicate email/username → 409 CONFLICT  
- Invalid credentials → 401 UNAUTHORIZED  
- Unverified email → 403 FORBIDDEN  
- Expired or invalid tokens → 400 BAD_REQUEST / 401 UNAUTHORIZED  
- Missing refresh token cookie → 400 BAD_REQUEST (MissingRequestCookieException)
- Missing or invalid input → 400 BAD_REQUEST  
- Unauthorized access → 401 UNAUTHORIZED

## Security Implementation
- **JWT Access Tokens**: Short-lived bearer tokens for API authentication
- **HTTP-Only Refresh Tokens**: Secure cookies preventing XSS attacks
- **BCrypt Password Hashing**: Industry-standard password encryption
- **CORS Configuration**: Controlled cross-origin requests
- **Method-Level Security**: `@PreAuthorize` annotations for endpoint protection
