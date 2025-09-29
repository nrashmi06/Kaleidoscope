# Kaleidoscope Backend Architecture Guide

## Overview
This guide provides a comprehensive overview of the Kaleidoscope backend architecture, explaining the folder structure, coding principles, and design patterns used throughout the application.

## Technology Stack
- **Framework**: Spring Boot 3.4.5
- **Language**: Java 21
- **Database**: PostgreSQL (primary), Redis (caching/streaming), Elasticsearch (search)
- **Build Tool**: Maven
- **Authentication**: JWT with HTTP-only refresh tokens
- **Documentation**: SpringDoc OpenAPI 3
- **Containerization**: Docker with docker-compose
- **Logging**: Logstash integration

## Project Structure

### Root Level
```
backend/
├── pom.xml                    # Maven configuration and dependencies
├── Dockerfile                 # Container configuration
├── docker-compose.yml         # Multi-service orchestration
├── logstash.conf             # Log processing configuration
├── docs/                     # API documentation
├── logs/                     # Application logs
├── src/                      # Source code
└── target/                   # Build artifacts
```

### Source Code Structure (`src/main/java/com/kaleidoscope/backend/`)

```
src/main/java/com/kaleidoscope/backend/
├── BackendApplication.java    # Spring Boot main application class
├── auth/                     # Authentication & Authorization module
├── blogs/                    # Blog management feature
├── ml/                       # Machine Learning pipeline
├── posts/                    # Photo posts management
├── shared/                   # Common utilities & components
└── users/                    # User management
```

## Domain-Driven Design (DDD) Architecture

### Module Organization
Each feature module follows a consistent layered architecture:

```
[feature-module]/
├── controller/               # REST API endpoints
│   ├── api/                 # OpenAPI interface definitions
│   └── [FeatureController]  # Controller implementations
├── dto/                     # Data Transfer Objects
│   ├── request/             # Request DTOs
│   └── response/            # Response DTOs
├── enums/                   # Feature-specific enumerations
├── exception/               # Custom exceptions
├── mapper/                  # Entity-DTO mapping utilities
├── model/                   # JPA entities
├── repository/              # Data access layer
├── routes/                  # Route constants
├── security/                # Feature-specific security
└── service/                 # Business logic layer
    └── impl/                # Service implementations
```

### Core Modules

#### 1. Authentication Module (`auth/`)
**Purpose**: Complete authentication and authorization system
**Key Components**:
- JWT token management with access/refresh token pattern
- Email verification workflow
- Password management (forgot/reset/change)
- Username availability checking
- HTTP-only cookie security for refresh tokens

**Architecture Pattern**: Stateless JWT with secure refresh mechanism

#### 2. User Management Module (`users/`)
**Purpose**: User profiles, preferences, and social features
**Sub-modules**:
- **Profile Management**: User account information and file uploads
- **Preferences**: Theme, language, privacy settings
- **Notification Preferences**: Granular notification controls
- **Interests**: Category-based user interests
- **Social Features**: Follow/unfollow, blocking system

**Architecture Pattern**: Multi-faceted user management with separate concerns

#### 3. Shared Module (`shared/`)
**Purpose**: Common utilities and cross-cutting concerns
**Components**:
- **Response Wrappers**: Standardized API responses (`ApiResponse<T>`, `PaginatedResponse<T>`)
- **Configuration**: Application-wide configurations
- **Document Models**: Elasticsearch document definitions
- **Services**: Common services (image storage, location management)
- **Utilities**: Helper classes and common functionality

**Architecture Pattern**: Centralized shared components with dependency injection

#### 4. Machine Learning Module (`ml/`)
**Purpose**: Asynchronous ML processing pipeline
**Components**:
- **Redis Stream Publisher**: Event publishing for ML processing
- **Stream Consumers**: Face detection and recognition processors
- **DTOs**: ML-specific data transfer objects

**Architecture Pattern**: Event-driven asynchronous processing with Redis Streams

#### 5. Posts Module (`posts/`)
**Purpose**: Photo post management system
**Key Features**:
- Post creation with media upload
- Post interaction (likes, comments)
- Post visibility and status management
- Media AI insights integration

**Architecture Pattern**: Content management with AI enhancement

#### 6. Blogs Module (`blogs/`)
**Purpose**: Blog content management
**Features**:
- Blog creation and management
- Media integration
- Admin controls

## Coding Principles & Patterns

### 1. **Separation of Concerns (SoC)**
- Each layer has a single responsibility
- Controllers handle HTTP requests/responses only
- Services contain business logic
- Repositories handle data persistence
- DTOs manage data transfer

### 2. **Dependency Inversion Principle**
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Extensive use of Spring's dependency injection

### 3. **Interface-Based Design**
- API interfaces (`UserApi`, `AuthApi`) separate documentation from implementation
- Service interfaces define contracts
- Repository interfaces extend Spring Data JPA

### 4. **Single Responsibility Principle**
- Each class has one reason to change
- Controllers focus on HTTP handling
- Services focus on business logic
- DTOs focus on data structure

### 5. **Open/Closed Principle**
- Classes are open for extension, closed for modification
- Strategy pattern for different authentication methods
- Extensible service implementations

## Spring Boot Patterns & Conventions

### 1. **Configuration Management**
```java
@Configuration
@EnableWebSecurity
@EnableJpaRepositories
public class SecurityConfig {
    // Configuration beans
}
```

### 2. **Dependency Injection**
```java
@RestController
@RequiredArgsConstructor  // Lombok for constructor injection
public class UserController {
    private final UserService userService;
}
```

### 3. **Validation**
```java
@Valid @RequestBody CreateUserDTO request
// Combined with DTO validation annotations
@NotNull @Size(min = 3, max = 50) private String username;
```

### 4. **Exception Handling**
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(...) {
        // Centralized error handling
    }
}
```

## Security Architecture

### 1. **JWT Authentication**
- **Access Tokens**: Short-lived (configurable expiration)
- **Refresh Tokens**: Long-lived, stored as HTTP-only cookies
- **Token Renewal**: Automatic refresh mechanism

### 2. **Method-Level Security**
```java
@PreAuthorize("isAuthenticated()")  // Requires authentication
@PreAuthorize("hasRole('ROLE_ADMIN')")  // Requires admin role
```

### 3. **Password Security**
- BCrypt hashing with salt
- Password strength validation
- Secure password reset workflow

### 4. **CORS Configuration**
- Configured for frontend integration
- Environment-specific settings

## Data Architecture

### 1. **Multi-Database Strategy**
- **PostgreSQL**: Primary transactional data
- **Redis**: Caching and stream processing
- **Elasticsearch**: Search and analytics

### 2. **Entity Relationships**
- JPA annotations for relationship mapping
- Lazy loading for performance
- Cascade operations where appropriate

### 3. **Data Transfer Pattern**
- Request DTOs for input validation
- Response DTOs for output formatting
- Entity-DTO mapping with MapStruct-style patterns

## API Design Principles

### 1. **RESTful Architecture**
- Standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Resource-based URL structure
- Appropriate status codes

### 2. **Consistent Response Format**
```java
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private List<String> errors;
    private long timestamp;
    private String path;
}
```

### 3. **Pagination Strategy**
```java
public class PaginatedResponse<T> {
    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    // ...pagination metadata
}
```

## Asynchronous Processing

### 1. **Redis Streams**
- Event-driven ML processing
- Reliable message delivery
- Consumer group patterns

### 2. **Async Configuration**
```java
@EnableAsync
@Configuration
public class AsyncConfig {
    @Bean
    public Executor taskExecutor() {
        // Custom thread pool configuration
    }
}
```

## Testing Strategy

### 1. **Test Organization**
```
src/test/java/
├── integration/          # Integration tests
├── unit/                # Unit tests
└── controller/          # Controller tests
```

### 2. **Testing Patterns**
- Unit tests for business logic
- Integration tests for API endpoints
- MockMvc for controller testing
- TestContainers for database testing

## Build & Deployment

### 1. **Maven Configuration**
- Multi-profile support (dev, prod)
- Dependency management
- Plugin configuration

### 2. **Docker Strategy**
- Multi-stage build process
- Optimized layer caching
- Environment-specific configurations

### 3. **Logging Configuration**
- Structured logging with Logstash
- Environment-specific log levels
- Centralized log management

## Development Guidelines

### 1. **Code Organization**
- Package by feature, not by layer
- Consistent naming conventions
- Clear separation of concerns

### 2. **Documentation Standards**
- OpenAPI 3 specifications
- Comprehensive README files
- Code comments for complex logic

### 3. **Version Control**
- Feature branch workflow
- Meaningful commit messages
- Code review requirements

### 4. **Performance Considerations**
- Database indexing strategy
- Caching mechanisms
- Pagination for large datasets
- Lazy loading patterns

## Configuration Management

### 1. **Environment Configuration**
```yaml
# application.yml
spring:
  profiles:
    active: ${SPRING_PROFILE:dev}
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/kaleidoscope}
```

### 2. **External Configuration**
- Environment variables for sensitive data
- Profile-specific configurations
- Docker compose environment files

## Monitoring & Observability

### 1. **Logging Strategy**
- Structured JSON logging
- Request/response logging
- Error tracking and alerting

### 2. **Health Checks**
- Spring Boot Actuator endpoints
- Database connectivity checks
- External service monitoring

## Extension Points

### 1. **Adding New Features**
1. Create feature module following DDD structure
2. Implement controller with OpenAPI interface
3. Define DTOs with validation
4. Implement service layer with business logic
5. Create repository for data access
6. Add comprehensive tests

### 2. **Integration Patterns**
- Event-driven communication via Redis Streams
- RESTful API integration
- Database integration patterns

This architecture guide provides the foundation for understanding and extending the Kaleidoscope backend system. Each component follows established Spring Boot patterns and modern Java development practices.
