# Authentication API Documentation

## Overview
Comprehensive authentication and authorization system for the Kaleidoscope application. Supports user registration, email verification, login, JWT access token issuance and renewal, password management, and logout.

**Base URL**: `/api/auth`

## Created Components

### 1. Routes (AuthRoutes.java)
- `REGISTER`            : POST   `/api/auth/register`
- `VERIFY_EMAIL`        : GET    `/api/auth/verify-email?token={token}`
- `LOGIN`               : POST   `/api/auth/login`
- `RENEW_TOKEN`         : POST   `/api/auth/renew-token`
- `FORGOT_PASSWORD`     : POST   `/api/auth/forgot-password`
- `RESET_PASSWORD`      : POST   `/api/auth/reset-password`
- `CHANGE_PASSWORD`     : PUT    `/api/auth/change-password`
- `LOGOUT`              : POST   `/api/auth/logout`

### 2. DTOs
- **Request**
  - `RegisterRequestDTO`        (email, password, username, optional profilePictureUrl)
  - `LoginRequestDTO`           (email, password)
  - `ForgotPasswordRequestDTO`  (email)
  - `ResetPasswordRequestDTO`   (token, newPassword)
  - `ChangePasswordRequestDTO`  (oldPassword, newPassword)
  - `LogoutRequestDTO`          (refreshToken)
- **Response**
  - `AuthResponseDTO`           (accessToken, refreshToken, tokenType, expiresIn)
  - `MessageResponseDTO`        (message)

### 3. Service Layer (AuthService)
Interface methods:
- `register(RegisterRequestDTO)`
- `verifyEmail(String token)`
- `login(LoginRequestDTO)`
- `forgotPassword(ForgotPasswordRequestDTO)`
- `resetPassword(ResetPasswordRequestDTO)`
- `changePassword(ChangePasswordRequestDTO)`
- `logout(LogoutRequestDTO)`

Implementation handles validation, email sending, JWT creation, refresh token persistence, and password encoding.

### 4. Controller (AuthController.java)
- Annotated with `@RestController`, `@Tag(name="Authentication")`
- Endpoints use `@PostMapping`, `@GetMapping`, `@PutMapping`
- All responses wrapped in `ApiResponse<T>`
- Swagger annotations for docs
- Security: open endpoints for register, verify, login, forgot/reset; secured for change-password and logout

### 5. Model
- `User` entity: id, email, password, username, enabled, roles, createdAt
- `RefreshToken` entity: id, user, token, expiryDate

### 6. Exceptions
- `UserAlreadyExistsException` → 409 Conflict
- `InvalidTokenException` → 400 Bad Request
- `ResourceNotFoundException` → 404 Not Found
- `AuthenticationException` → 401 Unauthorized
- `ValidationException` → 400 Bad Request

### 7. Security
- JWT-based authentication with `JwtUtils`
- Access token (short-lived), refresh token (long-lived)
- Passwords hashed with `BCryptPasswordEncoder`
- Method-level security with `@PreAuthorize`

## API Endpoints

### 1. Register User
```
POST /api/auth/register
Content-Type: application/json
```
**Body** (`RegisterRequestDTO`):
```json
{
  "email": "jane.doe@example.com",
  "username": "janedoe",
  "password": "P@ssw0rd!",
  "profilePictureUrl": "https://.../avatar.jpg"
}
```
**Response**: `201 Created`
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "path": "/api/auth/register",
  "timestamp": "2025-07-02T10:00:00Z",
  "data": null,
  "errors": []
}
```
**Errors**:
- `400 BAD_REQUEST` on invalid input
- `409 CONFLICT` if email or username already in use

### 2. Verify Email
```
GET /api/auth/verify-email?token={token}
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Email verified successfully",
  "path": "/api/auth/verify-email",
  "timestamp": "2025-07-02T10:05:00Z",
  "data": null,
  "errors": []
}
```
**Errors**:
- `400 BAD_REQUEST` if token invalid or expired
- `404 NOT_FOUND` if token not found

### 3. Login
```
POST /api/auth/login
Content-Type: application/json
```
**Body** (`LoginRequestDTO`):
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
    "expiresIn": 3600
  },
  "errors": []
}
```
**Errors**:
- `401 UNAUTHORIZED` on invalid credentials
- `403 FORBIDDEN` if email not verified

### 4. Renew Token
```
POST /api/auth/renew-token
Content-Type: application/json
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "path": "/api/auth/renew-token",
  "timestamp": "2025-07-02T10:15:00Z",
  "data": {
    "accessToken": "newAccessToken...",
    "refreshToken": "newRefreshToken...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  },
  "errors": []
}
```
**Errors**:
- `401 UNAUTHORIZED` if refresh token invalid or expired

### 5. Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json
```
**Body** (`ForgotPasswordRequestDTO`):
```json
{ "email": "jane.doe@example.com" }
```
**Response**: `200 OK`
```json
{ "success": true, "message": "Password reset email sent", "path": "/api/auth/forgot-password", "timestamp": "2025-07-02T10:20:00Z" }
```

### 6. Reset Password
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
{ "success": true, "message": "Password has been reset", "path": "/api/auth/reset-password", "timestamp": "2025-07-02T10:25:00Z" }
```
**Errors**:
- `400 BAD_REQUEST` for invalid or expired reset token

### 7. Change Password
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
{ "success": true, "message": "Password updated", "path": "/api/auth/change-password", "timestamp": "2025-07-02T10:30:00Z" }
```

### 8. Logout
```
POST /api/auth/logout
Content-Type: application/json
Authorization: Bearer <accessToken>
```
**Body** (`LogoutRequestDTO`):
```json
{ "refreshToken": "dGhpc2lscmVmdXJ..." }
```
**Response**: `200 OK`
```json
{ "success": true, "message": "Logged out successfully", "path": "/api/auth/logout", "timestamp": "2025-07-02T10:35:00Z" }
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
2. **Email Verification** → Activates account via verification token.  
3. **Login** → Authenticates and issues JWT access + refresh tokens.  
4. **Token Renewal** → Uses refresh token endpoint to get new access token.  
5. **Password Management** → Forgot/reset and change-password for account security.  
6. **Logout** → Revokes refresh token.

## Bruno API Test Suite
Located under `Kaleidoscope-api-test/auth/`:
- `register.bru`, `verify-email.bru`, `login.bru`, `renew token.bru`, `forgot password.bru`, `reset password.bru`, `change password.bru`, `logout.bru`.

## Features Implemented
✅ User registration with email confirmation  
✅ JWT access and refresh token management  
✅ Email verification workflow  
✅ Password reset and change endpoints  
✅ Logout with refresh token revoke  
✅ Comprehensive Swagger documentation  
✅ Validation annotations on DTOs  
✅ Custom exception handling  
✅ Secure password hashing with BCrypt  

## Error Scenarios Handled
- Duplicate email/username → 409 CONFLICT  
- Invalid credentials → 401 UNAUTHORIZED  
- Unverified email → 403 FORBIDDEN  
- Expired or invalid tokens → 400 BAD_REQUEST / 401 UNAUTHORIZED  
- Missing or invalid input → 400 BAD_REQUEST  
- Unauthorized access → 401 UNAUTHORIZED
