# Kaleidoscope Security Configuration Documentation
## Overview
The Kaleidoscope application implements a comprehensive security architecture using Spring Security, JWT-based authentication, CORS configuration, and custom filters for request tracking. This document details the security mechanisms, authentication flow, authorization rules, and best practices.
## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Security Filter Chain](#security-filter-chain)
3. [JWT Authentication](#jwt-authentication)
4. [CORS Configuration](#cors-configuration)
5. [Correlation ID Tracking](#correlation-id-tracking)
6. [SSE Authentication](#sse-authentication)
7. [Authorization Rules](#authorization-rules)
8. [Password Encryption](#password-encryption)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)
## Architecture Overview
### Security Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                       SECURITY ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    HTTP Request                               │   │
│  │              (with Authorization header)                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              CorrelationIdFilter                              │   │
│  │    - Generate/Extract correlation ID                          │   │
│  │    - Capture client IP, user agent, etc.                     │   │
│  │    - Add to MDC for logging                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              SseAuthenticationFilter                          │   │
│  │    - Handle SSE endpoint with query token                     │   │
│  │    - Validate JWT from query parameter                        │   │
│  │    - Set Security Context if valid                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │               AuthTokenFilter                                 │   │
│  │    - Extract JWT from Authorization header                    │   │
│  │    - Validate JWT signature and expiration                    │   │
│  │    - Extract user details (email, role, userId)              │   │
│  │    - Set Authentication in SecurityContext                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │            Authorization Check                                │   │
│  │    - Public endpoints: Allow                                  │   │
│  │    - Protected endpoints: Check authentication                │   │
│  │    - Role-based: Check @PreAuthorize annotations             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ├──── Authorized ────────────────────┐  │
│                              │                                     │  │
│                              ▼                                     ▼  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Request Handler                                     │   │
│  │         (Controller Method)                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              │                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │       Exception Handling                                      │   │
│  │    - AuthEntryPointJwt: 401 Unauthorized                     │   │
│  │    - CustomAccessDeniedHandler: 403 Forbidden                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```
### Key Components
- **SecurityConfig**: Main security configuration
- **JwtUtils**: JWT token generation and validation
- **AuthTokenFilter**: Standard JWT authentication filter
- **SseAuthenticationFilter**: Special filter for SSE connections
- **CorrelationIdFilter**: Request tracking and logging enrichment
- **CorsConfig**: Cross-Origin Resource Sharing configuration
## Security Filter Chain
### Filter Order
The filters are executed in this specific order:
```
1. CorrelationIdFilter (before HeaderWriterFilter)
   ↓
2. SseAuthenticationFilter (before UsernamePasswordAuthenticationFilter)
   ↓
3. AuthTokenFilter (before UsernamePasswordAuthenticationFilter)
   ↓
4. Spring Security Internal Filters
   ↓
5. Controller
```
### SecurityConfig Implementation
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CustomAccessDeniedHandler customAccessDeniedHandler,
            AuthTokenFilter authTokenFilter,
            SseAuthenticationFilter sseAuthenticationFilter
    ) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()))
                .authorizeHttpRequests(requests -> requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/actuator/health"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/stream")
                            .authenticated()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> 
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler)
                        .accessDeniedHandler(customAccessDeniedHandler)
                )
                .csrf(AbstractHttpConfigurer::disable)
                .addFilterBefore(correlationIdFilter, HeaderWriterFilter.class)
                .addFilterBefore(sseAuthenticationFilter, 
                    UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(authTokenFilter, 
                    UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
```
### Key Configuration Points
**Session Management**:
- `STATELESS`: No HTTP sessions created
- All authentication via JWT tokens
- No server-side session storage
**CSRF Protection**:
- Disabled for stateless API
- JWT tokens provide CSRF protection
**Exception Handling**:
- `AuthEntryPointJwt`: Returns 401 for unauthenticated requests
- `CustomAccessDeniedHandler`: Returns 403 for unauthorized access
## JWT Authentication
### JWT Token Structure
**Claims Included**:
```json
{
  "sub": "user@example.com",
  "role": "ROLE_USER",
  "userId": 123,
  "isUserInterestSelected": true,
  "theme": "DARK",
  "language": "en-US",
  "iat": 1729425000,
  "exp": 1729511400
}
```
### JWT Configuration
**application.yml**:
```yaml
jwt:
  secret: ${JWT_SECRET}              # 256-bit secret key
  expiration: 86400000               # 24 hours in milliseconds
  cookie-max-age-days: 7             # Cookie expiration (if used)
```
**Environment Variable**:
- `JWT_SECRET`: Base64-encoded secret key (minimum 256 bits)
- Generate with: `openssl rand -base64 32`
### Token Validation
**AuthTokenFilter Process**:
```java
@Override
protected void doFilterInternal(HttpServletRequest request, 
                                HttpServletResponse response, 
                                FilterChain filterChain) {
    // Skip if already authenticated (by previous filter)
    if (SecurityContextHolder.getContext().getAuthentication() != null) {
        filterChain.doFilter(request, response);
        return;
    }
    try {
        // Extract JWT from Authorization header
        String jwt = parseJwt(request);
        if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
            // Extract claims
            String email = jwtUtils.getUserNameFromJwtToken(jwt);
            String role = jwtUtils.getRoleFromJwtToken(jwt);
            // Create UserDetails
            UserDetails userDetails = User.builder()
                    .username(email)
                    .authorities(new SimpleGrantedAuthority(role))
                    .password("")
                    .build();
            // Set Authentication in SecurityContext
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                    );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        filterChain.doFilter(request, response);
    } catch (ExpiredJwtException ex) {
        request.setAttribute("expired", true);
        filterChain.doFilter(request, response);
    } catch (JwtException ex) {
        request.setAttribute("auth_error_message", "Invalid JWT: " + ex.getMessage());
        filterChain.doFilter(request, response);
    }
}
```
## CORS Configuration
### Allowed Origins
**Configuration**:
```yaml
allowed:
  origins: ${ALLOWED_ORIGINS:http://localhost:3000,http://localhost:8080}
```
**Environment Variable**:
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- Example: `https://kaleidoscope.com,https://app.kaleidoscope.com`
### CORS Settings
**CorsConfig Implementation**:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    // Allowed origins from environment
    configuration.setAllowedOrigins(parseOrigins(allowedOrigins));
    // Allowed HTTP methods
    configuration.setAllowedMethods(Arrays.asList(
        "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
    ));
    // Allowed headers
    configuration.setAllowedHeaders(Arrays.asList(
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "If-None-Match",
        "Cookie",
        "Set-Cookie"
    ));
    // Exposed headers (visible to frontend)
    configuration.setExposedHeaders(Arrays.asList(
        "Authorization",
        "Content-Type",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Credentials",
        "ETag",
        "Set-Cookie"
    ));
    // Allow credentials (cookies, authorization headers)
    configuration.setAllowCredentials(true);
    // Cache preflight requests for 1 hour
    configuration.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```
### CORS Features
**Allow Credentials**:
- Enables cookies and Authorization headers
- Required for JWT authentication
- Frontend must set `credentials: 'include'`
**Preflight Caching**:
- OPTIONS requests cached for 1 hour
- Reduces preflight overhead
- Browser automatically sends OPTIONS before actual request
## Correlation ID Tracking
### Purpose
Correlation IDs enable:
1. **Request Tracing**: Track request through entire system
2. **Log Aggregation**: Correlate logs from different services
3. **Debugging**: Easily find all logs related to a specific request
4. **Performance Monitoring**: Track request duration
### CorrelationIdFilter Implementation
```java
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
        Instant startTime = Instant.now();
        try {
            // Extract or generate correlation ID
            String correlationId = request.getHeader(CORRELATION_ID_HEADER);
            if (correlationId == null || correlationId.trim().isEmpty()) {
                correlationId = UUID.randomUUID().toString();
            }
            // Add to MDC (available in all logs)
            MDC.put("correlationId", correlationId);
            response.setHeader(CORRELATION_ID_HEADER, correlationId);
            // Capture request details
            MDC.put("requestMethod", request.getMethod());
            MDC.put("requestUri", request.getRequestURI());
            MDC.put("clientIp", getClientIpAddress(request));
            MDC.put("userAgent", request.getHeader("User-Agent"));
            // Continue filter chain
            filterChain.doFilter(request, response);
            // Capture response details
            Duration duration = Duration.between(startTime, Instant.now());
            MDC.put("responseStatus", String.valueOf(response.getStatus()));
            MDC.put("responseTimeMs", String.valueOf(duration.toMillis()));
        } finally {
            // Always clear MDC to prevent memory leaks
            MDC.clear();
        }
    }
}
```
## SSE Authentication
### Special Authentication for Server-Sent Events
**Challenge**: SSE connections cannot send custom headers after initial request
**Solution**: Authentication via query parameter
### Frontend SSE Connection
```javascript
const token = localStorage.getItem('jwt_token');
const eventSource = new EventSource(
    `http://localhost:8080/kaleidoscope/api/notifications/stream?token=${token}`
);
eventSource.addEventListener('unseen-count', (event) => {
    console.log('Unread notifications:', event.data);
});
```
## Authorization Rules
### Public Endpoints
**No authentication required**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation
- `GET /api-docs/**` - API documentation
- `GET /swagger-ui/**` - Swagger UI
- `GET /actuator/health` - Health check
- `OPTIONS /**` - CORS preflight requests
### Role-Based Authorization
**Admin-Only Endpoints**:
Uses `@PreAuthorize("hasRole('ADMIN')")` annotation:
```java
@PatchMapping("/api/blogs/{blogId}/status")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> updateBlogStatus(@PathVariable Long blogId) {
    // Only admins can change blog status
}
@DeleteMapping("/api/blogs/{blogId}/hard")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> hardDeleteBlog(@PathVariable Long blogId) {
    // Only admins can permanently delete blogs
}
```
## Password Encryption
### BCrypt Password Encoder
**Configuration**:
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```
**Features**:
- Industry-standard hashing algorithm
- Automatic salt generation
- Configurable work factor (default: 10)
- One-way encryption (cannot be decrypted)
## Security Best Practices
### 1. JWT Token Security
✅ **Use strong secret keys**: Minimum 256 bits, randomly generated  
✅ **Set reasonable expiration**: 24 hours for access tokens  
✅ **Never expose secret in logs**: Mask sensitive data  
✅ **Validate on every request**: Don't trust client-side validation  
✅ **Include minimal claims**: Avoid sensitive data in JWT  
✅ **Use HTTPS in production**: Prevent token interception
### 2. Password Security
✅ **Use BCrypt**: Industry standard with automatic salting  
✅ **Never log passwords**: Even encrypted ones  
✅ **Enforce password complexity**: Minimum length, special characters  
✅ **Implement rate limiting**: Prevent brute force attacks  
✅ **Require password change**: After reset or suspicious activity
### 3. CORS Configuration
✅ **Whitelist specific origins**: Don't use wildcards in production  
✅ **Enable credentials carefully**: Only when needed  
✅ **Validate origin header**: Server-side validation  
✅ **Cache preflight requests**: Reduce overhead  
✅ **Document allowed origins**: Keep environment configs updated
## Troubleshooting
### Issue 1: "401 Unauthorized" on valid token
**Possible Causes**:
- Token expired
- Invalid signature (wrong secret key)
- Token not in Authorization header
- Header format incorrect
**Debug Steps**:
```bash
# Verify header format
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/posts
# Check logs for JWT validation errors
grep "JWT" logs/kaleidoscope.log
```
### Issue 2: CORS errors in browser
**Symptoms**:
```
Access to fetch at 'http://localhost:8080/api/posts' from origin 
'http://localhost:3000' has been blocked by CORS policy
```
**Solutions**:
1. Add origin to `ALLOWED_ORIGINS` environment variable
2. Ensure frontend sends `credentials: 'include'` if using cookies
3. Check preflight OPTIONS request succeeds
4. Verify CORS headers in response
### Issue 3: SSE connection fails
**Symptoms**:
```
EventSource connection failed: 401 Unauthorized
```
**Solutions**:
1. Include token in query parameter: `?token=<jwt>`
2. Verify token is valid (not expired)
3. Check SseAuthenticationFilter logs
4. Ensure endpoint path matches filter configuration
## Conclusion
The Kaleidoscope Security Configuration provides a robust, multi-layered security architecture:
✅ **JWT Authentication**: Stateless, scalable token-based auth  
✅ **CORS Protection**: Controlled cross-origin access  
✅ **Request Tracking**: Correlation IDs for debugging  
✅ **SSE Support**: Special handling for real-time connections  
✅ **Role-Based Authorization**: Granular access control  
✅ **Password Security**: BCrypt encryption with salting  
✅ **Error Handling**: Graceful failures with informative responses  
✅ **Logging Integration**: MDC context for log enrichment
