# Kaleidoscope
Kaleidoscope is an enterprise photo-sharing platform designed to foster cultural connection and community building among employees across different geographic locations.

## 🏗️ Project Architecture

### Technology Stack
- **Backend**: Spring Boot 3.4.5 with Java 21
- **Frontend**: Next.js 15.3.2 with React 19 RC
- **Database**: PostgreSQL, Redis, Elasticsearch
- **Authentication**: JWT with HTTP-only refresh tokens
- **AI/ML**: Custom face detection and recognition pipeline
- **API Testing**: Bruno HTTP Client
- **Documentation**: SpringDoc OpenAPI 3 (Swagger)

### Project Structure
```
Kaleidoscope/
├── README.md                           # This file - project overview
├── backend/                            # Spring Boot API backend
│   ├── docs/                          # Comprehensive documentation
│   │   ├── BACKEND_ARCHITECTURE.md    # 📚 Backend architecture guide
│   │   └── api/                       # 🔌 API documentation packages
│   │       ├── API_OVERVIEW.md        # Master API documentation
│   │       ├── authentication/        # Auth system docs
│   │       ├── user-management/       # User profile & preferences
│   │       ├── social-features/       # Follow/block systems
│   │       ├── content-management/    # Category management
│   │       └── admin/                 # Administrative controls
│   ├── src/main/java/com/kaleidoscope/backend/
│   │   ├── auth/                      # Authentication & authorization
│   │   ├── users/                     # User management & social features
│   │   ├── posts/                     # Photo posts & interactions
│   │   ├── blogs/                     # Blog content management
│   │   ├── ml/                        # ML pipeline (face detection/recognition)
│   │   └── shared/                    # Common utilities & configurations
│   └── pom.xml                        # Maven dependencies
├── frontend/                           # Next.js React frontend
│   ├── public/                        # Static assets
│   └── src/                           # React components & logic
└── Kaleidoscope-api-test/             # Bruno API testing suite
    ├── auth/                          # Authentication endpoint tests
    ├── users/                         # User management tests
    ├── posts/                         # Post management tests
    └── [other test modules]           # Feature-specific test collections
```

## 📖 Documentation Navigation

### For Developers
- **🏗️ [Backend Architecture Guide](backend/docs/BACKEND_ARCHITECTURE.md)** - Complete backend structure, coding principles, and design patterns
- **🔌 [API Documentation](backend/docs/api/API_OVERVIEW.md)** - Master API documentation with links to all endpoints
- **🧪 [API Testing](Kaleidoscope-api-test/)** - Bruno HTTP client test collections

### Architecture Deep Dive
- **[Domain-Driven Design](backend/docs/BACKEND_ARCHITECTURE.md#domain-driven-design-ddd-architecture)** - Module organization and separation of concerns
- **[Security Architecture](backend/docs/BACKEND_ARCHITECTURE.md#security-architecture)** - JWT authentication and authorization
- **[Data Architecture](backend/docs/BACKEND_ARCHITECTURE.md#data-architecture)** - Multi-database strategy
- **[Coding Principles](backend/docs/BACKEND_ARCHITECTURE.md#coding-principles--patterns)** - SOLID principles and Spring patterns

### API Documentation Packages
- **[Authentication APIs](backend/docs/api/authentication/)** - Login, registration, password management
- **[User Management APIs](backend/docs/api/user-management/)** - Profiles, preferences, interests
- **[Social Features APIs](backend/docs/api/social-features/)** - Follow/unfollow, blocking system
- **[Content Management APIs](backend/docs/api/content-management/)** - Category hierarchy
- **[Admin APIs](backend/docs/api/admin/)** - Administrative controls

## 🚀 Quick Start Guide

### Prerequisites
- Java 21+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Elasticsearch 8+
- Maven 3.8+

### Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### API Testing
1. Open Bruno HTTP Client
2. Import collection from `Kaleidoscope-api-test/`
3. Configure environment variables
4. Run test suites

## 🔧 Development Environment

### Local Development URLs
- **Backend API**: `http://localhost:8080/kaleidoscope`
- **Frontend**: `http://localhost:3000`
- **Swagger UI**: `http://localhost:8080/kaleidoscope/swagger-ui.html`
- **API Docs**: `http://localhost:8080/kaleidoscope/api-docs`

### Database Configuration
Configure your local environment variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kaleidoscope
DB_USERNAME=postgres
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🏢 Enterprise Features

### Core Capabilities
- **Photo Sharing**: Upload, organize, and share photos with colleagues
- **Cultural Connection**: Category-based content organization for cultural exchange
- **Social Features**: Follow colleagues, build professional networks
- **AI Enhancement**: Face detection and recognition for photo tagging
- **Admin Controls**: Comprehensive administrative oversight

### Security & Privacy
- **Enterprise Authentication**: JWT-based secure authentication
- **Privacy Controls**: Granular privacy and visibility settings
- **Content Safety**: User blocking and content moderation
- **Data Protection**: Secure file storage and processing

### Scalability & Performance
- **Multi-Database Architecture**: PostgreSQL + Redis + Elasticsearch
- **Asynchronous Processing**: Event-driven ML pipeline
- **Caching Strategy**: Redis-based caching for performance
- **Search Capabilities**: Elasticsearch-powered content discovery

## 🧑‍💻 Developer Onboarding

### New to the Project?
1. **Start Here**: Read this README for project overview
2. **Architecture**: Review [Backend Architecture Guide](backend/docs/BACKEND_ARCHITECTURE.md)
3. **API Documentation**: Explore [API Overview](backend/docs/api/API_OVERVIEW.md)
4. **Testing**: Familiarize yourself with Bruno test collections
5. **Code Style**: Follow established patterns in existing modules

### Understanding the Codebase
- **Module Structure**: Each feature follows Domain-Driven Design
- **Coding Principles**: SOLID principles with Spring Boot patterns
- **API Design**: RESTful APIs with OpenAPI 3 specifications
- **Security**: JWT authentication with role-based access control

### Making Changes
1. **Feature Development**: Follow the module structure pattern
2. **API Changes**: Update both implementation and documentation
3. **Testing**: Add tests to relevant Bruno collections
4. **Documentation**: Update relevant documentation files

## 📊 Project Status

### Implemented Features
- ✅ Complete authentication system with JWT
- ✅ User profile and preference management
- ✅ Social features (follow/unfollow, blocking)
- ✅ Category-based content organization
- ✅ Admin controls and oversight
- ✅ ML pipeline for face detection/recognition
- ✅ Comprehensive API documentation
- ✅ Complete test coverage with Bruno

### Technology Highlights
- **Modern Stack**: Latest Spring Boot 3.4.5 with Java 21
- **Enterprise Security**: JWT + refresh tokens + role-based access
- **Scalable Architecture**: Microservice-ready domain-driven design
- **Comprehensive Testing**: Bruno HTTP client test suites
- **Professional Documentation**: Enterprise-grade API documentation

## 🤝 Contributing

### Development Workflow
1. Review architecture and coding guidelines
2. Create feature branch from main
3. Implement following established patterns
4. Update documentation and tests
5. Submit pull request with comprehensive description

### Code Quality Standards
- Follow existing module structure and naming conventions
- Maintain comprehensive test coverage
- Update documentation for any API changes
- Ensure security best practices are followed

---

**Final Year Project** - Enterprise Photo-Sharing Platform  
**Tech Stack**: Spring Boot 3.4.5 + Next.js 15.3.2 + PostgreSQL + Redis + Elasticsearch  
**Architecture**: Domain-Driven Design with JWT Security
