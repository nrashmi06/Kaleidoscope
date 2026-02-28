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
├── admin/                    # Admin operations (mass email, etc.)
├── async/                    # Async processing, Redis Stream consumers & ML pipeline
├── auth/                     # Authentication & Authorization module
├── blogs/                    # Blog management feature
├── notifications/            # Notification system (SSE, email, in-app)
├── posts/                    # Photo posts management
├── readmodels/               # AI/ML read model tables for search
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
**Purpose**: Cross-cutting concerns and reusable components used across all feature modules
**Components**:
- **Controllers**: Category, Hashtag, Location, UserTag (shared between posts & blogs)
- **Services**: InteractionService (unified reactions & comments), ImageStorageService, HashtagService, CategoryService, LocationService, UserTagService
- **Response Wrappers**: Standardized API responses (`AppResponse<T>`, `PaginatedResponse<T>`)
- **Models**: Comment, Reaction, Category, Hashtag, Location, UserTag, MediaAssetTracker, PostHashtag
- **Enums**: ContentType, ReactionType, Role, AccountStatus, MediaType, NotificationType, etc.
- **Configuration**: AsyncConfig, CloudinaryConfig, CorrelationIdFilter, OpenApiConfig
- **Scheduler**: MediaAssetCleanupScheduler (hourly orphaned media cleanup)
- **Sync**: ElasticsearchStartupSyncService (startup data sync to ES)

**Architecture Pattern**: Centralized shared components with dependency injection

For detailed documentation, see [SHARED_MODULE.md](SHARED_MODULE.md)

#### 4. Admin Module (`admin/`)
**Purpose**: Site-wide administrative operations
**Key Components**:
- Mass email broadcasting with file attachments
- Role-based targeting (ADMIN, MODERATOR, USER)
- Async email dispatch via Spring `@Async`

**Architecture Pattern**: Admin command pattern with async execution

For detailed documentation, see [ADMIN_SYSTEM.md](ADMIN_SYSTEM.md)

#### 5. Async Processing Module (`async/`)
**Purpose**: Centralized asynchronous event processing and ML pipeline
**Components**:
- **Redis Stream Publisher**: Event publishing for ML processing and sync
- **Stream Consumers**: Face detection, face recognition, media AI insights, hashtag usage sync, post insights enrichment
- **Services**: Read model updates, ES sync triggers, post aggregation triggers, processing status tracking
- **DTOs**: ML-specific and sync-specific data transfer objects
- **Config**: Redis connection, stream consumer groups, listener container

**Architecture Pattern**: Event-driven asynchronous processing with Redis Streams and consumer groups

For detailed documentation, see [ASYNC_PROCESSING_SYSTEM.md](ASYNC_PROCESSING_SYSTEM.md)

#### 6. Notifications Module (`notifications/`)
**Purpose**: Real-time notification system
**Key Features**:
- Server-Sent Events (SSE) for real-time browser updates
- Redis-backed notification caching and unread counts
- Email notification delivery
- User notification preference integration

**Architecture Pattern**: Event-driven real-time push with SSE and Redis pub/sub

For detailed documentation, see [NOTIFICATION_SYSTEM.md](NOTIFICATION_SYSTEM.md)

#### 7. Posts Module (`posts/`)
**Purpose**: Photo post management system
**Key Features**:
- Post creation with media upload
- Post interactions (reactions, comments, comment reactions)
- Post save/unsave (bookmarking)
- Post visibility and status management
- Media AI insights integration
- Post suggestions via Elasticsearch function_score
- Async view counting with Redis and batch DB sync
- Elasticsearch document sync consumers

**Architecture Pattern**: Content management with AI enhancement and real-time search

For detailed documentation, see [POSTS_SYSTEM.md](POSTS_SYSTEM.md)

#### 8. Blogs Module (`blogs/`)
**Purpose**: Blog content management with approval workflow
**Features**:
- Blog creation with rich media and categorization
- Admin review and approval workflow
- Blog interactions (reactions, comments)
- Blog save/unsave (bookmarking)
- Blog suggestions via Elasticsearch function_score
- Async view counting with Redis and batch DB sync
- Soft deletion
- Elasticsearch document sync consumers

**Architecture Pattern**: Content management with editorial workflow

For detailed documentation, see [BLOG_SYSTEM.md](BLOG_SYSTEM.md)

#### 9. Read Models Module (`readmodels/`)
**Purpose**: Denormalized read model tables for AI-powered search
**Components**:
- 7 PostgreSQL read model tables (media_search, post_search, face_search, known_faces, user_search, feed_personalized, recommendations_knn)
- JPA entities and Spring Data repositories
- Updated by async consumers and external AI services
- Synced to Elasticsearch via ES sync queue

**Architecture Pattern**: CQRS-style read model separation

For detailed documentation, see [READ_MODELS_SYSTEM.md](READ_MODELS_SYSTEM.md)

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
Example of validation usage:
```java
// Valid request body with DTO validation annotations
@PostMapping("/api/users")
public ResponseEntity<UserResponseDTO> createUser(@Valid @RequestBody CreateUserDTO request) {
    // Controller method implementation
}

// Example DTO validation annotations
public class CreateUserDTO {
    @NotNull 
    @Size(min = 3, max = 50) 
    private String username;
}
```

### 4. **Exception Handling**
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation() {
        // Centralized error handling
        return ResponseEntity.badRequest().build();
    }
}
```

## Security Architecture

For detailed authentication system documentation, see [AUTHENTICATION_SYSTEM.md](AUTHENTICATION_SYSTEM.md)

### 1. **JWT Authentication**
- **Access Tokens**: Short-lived (configurable expiration)
- **Refresh Tokens**: Long-lived, stored as HTTP-only cookies
- **Token Renewal**: Automatic refresh mechanism

### 2. **Method-Level Security**
Example security annotations:
```java
// Requires authentication
@PreAuthorize("isAuthenticated()")
public ResponseEntity<PostResponseDTO> getPost() {
    // Method implementation
}

// Requires admin role  
@PreAuthorize("hasRole('ROLE_ADMIN')")
public ResponseEntity<AdminResponseDTO> adminFunction() {
    // Admin method implementation
}
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
