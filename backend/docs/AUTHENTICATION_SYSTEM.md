# Kaleidoscope Authentication System Documentation

## Overview
The Kaleidoscope authentication system is built using Spring Security with JWT (JSON Web Tokens) and implements a comprehensive security architecture with refresh tokens, email verification, and role-based access control.

## Architecture Components

### Core Technologies
- **Spring Security 6.x**: Main security framework
- **JWT (JSON Web Tokens)**: Stateless authentication
- **BCrypt**: Password hashing
- **HTTP-only Cookies**: Secure token storage
- **Email Verification**: Account activation system
- **Refresh Tokens**: Token renewal mechanism

### Key Components Structure

```
auth/
├── config/
│   ├── CorsConfig.java              # Cross-Origin Resource Sharing configuration
│   ├── JwtProperties.java           # JWT configuration properties
│   ├── ResendProperties.java        # Resend email API configuration (apiKey, fromEmail)
│   └── SecurityConfig.java          # Main security configuration
├── controller/
│   ├── AuthController.java          # Authentication REST endpoints
│   └── AuthViewController.java      # View-based auth endpoints
├── dto/
│   ├── request/                     # Request DTOs for auth operations
│   └── response/                    # Response DTOs for auth operations
├── exception/
│   ├── AuthExceptionHandler.java    # Centralized auth exception handling
│   ├── auth/                        # Auth-specific exceptions
│   ├── email/                       # Email verification exceptions
│   └── token/                       # Token-related exceptions
├── model/
│   ├── EmailVerification.java       # Email verification entity
│   └── RefreshToken.java           # Refresh token entity
├── repository/
│   ├── EmailVerificationRepository.java
│   └── RefreshTokenRepository.java
├── security/
│   ├── CustomAccessDeniedHandler.java
│   ├── filter/                      # Security filters
│   └── jwt/                         # JWT utilities and filters
├── service/
│   ├── AuthService.java            # Main authentication service
│   ├── EmailService.java           # Email verification service
│   ├── RefreshTokenService.java    # Refresh token management
│   ├── UserRegistrationService.java # User registration logic
│   └── impl/                        # Service implementations
└── routes/
    └── AuthRoutes.java             # Route constants
```

## Authentication Flow

### 1. User Registration Flow
```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant UserService
    participant EmailService
    participant Database

    Client->>AuthController: POST /auth/register
    AuthController->>AuthService: registerUser(dto)
    AuthService->>UserService: createUser(userData)
    UserService->>Database: Save user (PENDING status)
    AuthService->>EmailService: sendVerificationEmail()
    EmailService->>Database: Save verification token
    EmailService-->>Client: Verification email sent
    AuthController-->>Client: Registration success response
```

### 2. Email Verification Flow
```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant Database

    Client->>AuthController: POST /auth/verify-email?token=xxx
    AuthController->>AuthService: verifyEmail(token)
    AuthService->>Database: Find verification token
    AuthService->>Database: Update user status to ACTIVE
    AuthService->>Database: Delete verification token
    AuthController-->>Client: Email verified successfully
```

### 3. Login Flow
```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant JwtUtils
    participant RefreshTokenService
    participant Database

    Client->>AuthController: POST /auth/login
    AuthController->>AuthService: loginUser(credentials)
    AuthService->>Database: Validate user credentials
    AuthService->>JwtUtils: generateAccessToken(user)
    AuthService->>RefreshTokenService: createRefreshToken(user)
    RefreshTokenService->>Database: Save refresh token
    AuthService-->>AuthController: Return tokens + user data
    AuthController-->>Client: Set HTTP-only cookie + response
```

### 4. Token Refresh Flow
```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant RefreshTokenService
    participant JwtUtils
    participant Database

    Client->>AuthController: POST /auth/renew-token
    AuthController->>RefreshTokenService: refreshToken(token)
    RefreshTokenService->>Database: Validate refresh token
    RefreshTokenService->>JwtUtils: generateNewAccessToken()
    RefreshTokenService->>Database: Update refresh token expiry
    AuthController-->>Client: New access token
```

## Security Configuration

For detailed security filter chain, CORS, SSE authentication, and authorization rules, see [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md).

## JWT Token System

### Access Tokens
- **Purpose**: API authentication
- **Storage**: Memory/Local storage on client
- **Expiration**: Short-lived (configurable, typically 15-30 minutes)
- **Claims**: User ID, username, roles, expiration

### Refresh Tokens
- **Purpose**: Renewing expired access tokens
- **Storage**: HTTP-only secure cookies
- **Expiration**: Long-lived (configurable, typically 7-30 days)
- **Database**: Stored in `refresh_tokens` table
- **Security**: Single-use or limited-use tokens

### Token Structure
```json
{
  "sub": "user123",
  "username": "john.doe",
  "roles": ["USER"],
  "iat": 1640995200,
  "exp": 1641001200
}
```

## Password Security

### Password Hashing
- **Algorithm**: BCrypt with configurable strength
- **Salt**: Automatically generated per password
- **Storage**: Hashed passwords stored in database

### Password Reset Flow
1. User requests password reset with email
2. System generates secure verification token
3. Email sent with reset link containing token
4. User clicks link and provides new password
5. Token validated and password updated
6. All existing refresh tokens invalidated

## Email Verification System

### Verification Process
1. **Registration**: User account created with `PENDING` status
2. **Token Generation**: Unique verification token created
3. **Email Sending**: Verification email with token link
4. **Verification**: Token validation activates account
5. **Cleanup**: Expired tokens automatically removed

### EmailVerification Entity
```java
@Entity
public class EmailVerification {
    private Long id;
    private String token;          // Unique verification token
    private Instant expiry;        // Token expiration time
    private User user;             // Associated user
}
```

## Exception Handling

### Custom Exception Types
- **AuthenticationException**: Invalid credentials
- **JwtTokenExpiredException**: Expired JWT tokens
- **EmailVerificationException**: Email verification issues
- **RefreshTokenException**: Refresh token problems

### Global Exception Handler
The `AuthExceptionHandler` provides centralized handling of authentication-related exceptions with appropriate HTTP status codes and error messages.

## Security Best Practices

For comprehensive security best practices including JWT security, password security, CORS, and session management, see [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md).

## Configuration Properties

### JWT Configuration (`JwtProperties`)
```yaml
kaleidoscope:
  jwt:
    secret: ${JWT_SECRET}
    access-token-expiration: 900000      # 15 minutes
    refresh-token-expiration: 604800000  # 7 days
```

### Email Configuration
```yaml
spring:
  mail:
    host: ${SMTP_HOST}
    port: ${SMTP_PORT}
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
```

## API Endpoints Reference

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/renew-token` - Refresh access token

### Password Management
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/change-password` - Change password (authenticated)

### Email Verification
- `POST /auth/verify-email` - Verify email with token
- `POST /auth/resend-verification` - Resend verification email

### Utility Endpoints
- `GET /auth/check-username` - Check username availability

## Monitoring and Logging

### Security Events Logged
- Login attempts (successful/failed)
- Password reset requests
- Email verification attempts
- Token refresh operations
- Access denied events

### Correlation ID
- Each request gets a unique correlation ID
- Enables tracing of requests across services
- Included in all log entries for debugging

## Testing with Bruno HTTP Client

The authentication system can be tested using the Bruno HTTP client with the test collection located in `/Kaleidoscope-api-test/auth/`. This includes tests for:
- User registration and verification
- Login and logout flows
- Token refresh operations
- Password reset functionality
- Username availability checks

## Future Enhancements

### Planned Features
- Multi-factor authentication (MFA)
- OAuth2 integration (Google, GitHub)
- Rate limiting for authentication endpoints
- Advanced session management
- Audit logging for security events

### Security Improvements
- Token blacklisting for logout
- Device fingerprinting
- Suspicious activity detection
- Geographic login restrictions
