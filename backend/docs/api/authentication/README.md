# Authentication APIs

## Overview
Complete authentication and authorization system for the Kaleidoscope application with JWT-based security, email verification, and comprehensive user account management.

## Endpoints
- **User Registration**: Account creation with email verification
- **Login/Logout**: Session management with JWT tokens
- **Password Management**: Forgot password, reset, and change functionality
- **Token Management**: Access token renewal with refresh tokens
- **Account Verification**: Email verification and username availability

## Security Features
- JWT access tokens (short-lived)
- HTTP-only refresh token cookies (long-lived)
- BCrypt password hashing
- Email verification workflow
- CORS protection
- Rate limiting (if implemented)

## Documentation
- [**Authentication API**](Authentication-API.md) - Complete authentication system documentation

## Related Bruno Tests
Located in `/Kaleidoscope-api-test/auth/`:
- User registration and verification
- Login/logout flows
- Password management
- Token renewal
- Username availability checking
