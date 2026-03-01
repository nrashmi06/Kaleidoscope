# Kaleidoscope Admin System Documentation

## Overview

The Admin System provides site-wide administrative operations for privileged users with the `ADMIN` role. It currently supports mass email broadcasting with optional file attachments, designed for emergency communications that bypass user notification preferences.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Admin Module Structure](#admin-module-structure)
3. [Mass Email Broadcasting](#mass-email-broadcasting)
4. [API Endpoints](#api-endpoints)
5. [Security & Authorization](#security--authorization)
6. [Async Processing](#async-processing)
7. [Email Templates](#email-templates)
8. [Best Practices](#best-practices)

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ADMIN SYSTEM                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                Admin (ROLE_ADMIN) Request                     │   │
│  │            POST /api/admin/send-mass-email                    │   │
│  │            (multipart/form-data)                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    AdminController                            │   │
│  │              (implements AdminApi)                            │   │
│  │   - Validates MassEmailRequestDTO                            │   │
│  │   - Accepts multipart attachments                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   AdminServiceImpl                            │   │
│  │   @Async("taskExecutor")                                     │   │
│  │   - Queries active users by target roles                     │   │
│  │   - Iterates recipients, sends email per user                │   │
│  │   - Logs progress every 100 emails                           │   │
│  │   - Gracefully handles per-recipient failures                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    EmailService                               │   │
│  │   (from auth module)                                         │   │
│  │   - Uses Resend API for email delivery                       │   │
│  │   - Supports HTML templates                                  │   │
│  │   - Handles file attachments                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Technologies

- **Spring Security**: `@PreAuthorize("hasRole('ADMIN')")` for role-based access control
- **Spring Async**: Non-blocking email dispatch via `@Async("taskExecutor")`
- **Multipart Form Data**: Support for file attachments alongside JSON payload
- **Resend API**: Transactional email delivery service

## Admin Module Structure

```
admin/
├── controller/
│   ├── AdminController.java          # REST endpoint implementation
│   └── api/
│       └── AdminApi.java             # OpenAPI interface definition
├── dto/
│   └── request/
│       └── MassEmailRequestDTO.java  # Request payload (subject, body, targetRoles)
├── routes/
│   └── AdminRoutes.java              # Route constants
└── service/
    ├── AdminService.java             # Service interface
    └── impl/
        └── AdminServiceImpl.java     # Async email broadcasting implementation
```

## Mass Email Broadcasting

### Purpose
Emergency communication system that sends bulk emails to all **active** users belonging to specified roles. This feature bypasses individual user notification preferences and is intended for critical announcements only.

### Request Payload

```java
public record MassEmailRequestDTO(
    @NotBlank(message = "Subject is required")
    String subject,

    @NotBlank(message = "Body is required")
    String body,

    @NotEmpty(message = "At least one target role is required")
    List<Role> targetRoles  // ADMIN, MODERATOR, USER
) {}
```

### Flow

1. Admin sends `POST /api/admin/send-mass-email` with multipart form data
2. Controller validates the request DTO and extracts optional attachments
3. Returns **200 OK** immediately ("Mass email job started successfully")
4. `AdminServiceImpl.sendMassEmail()` runs asynchronously on the `taskExecutor` thread pool
5. Queries `UserRepository.findActiveEmailsByRoles(targetRoles)` for recipient list
6. Iterates through recipients, calling `EmailService.sendNotificationEmail()` for each
7. Logs progress every 100 emails dispatched
8. Failures for individual recipients are caught and logged without stopping the batch

### Target Roles

| Role        | Description                              |
|-------------|------------------------------------------|
| `ADMIN`     | Site administrators                      |
| `MODERATOR` | Content moderators                       |
| `USER`      | Regular users                            |

## API Endpoints

### Send Mass Email

```
POST /api/admin/send-mass-email
Content-Type: multipart/form-data
Authorization: Bearer <admin_jwt_token>
```

**Request Parts:**

| Part          | Type                      | Required | Description                                      |
|---------------|---------------------------|----------|--------------------------------------------------|
| `emailData`   | `MassEmailRequestDTO` JSON | Yes      | Subject, body (HTML), and target roles            |
| `attachments` | `MultipartFile[]`          | No       | Optional file attachments (one or many)           |

**Example Request (cURL):**
```bash
curl -X POST http://localhost:8080/kaleidoscope/api/admin/send-mass-email \
  -H "Authorization: Bearer <token>" \
  -F 'emailData={"subject":"System Maintenance","body":"<h1>Notice</h1><p>Scheduled downtime tonight.</p>","targetRoles":["USER","MODERATOR"]};type=application/json' \
  -F "attachments=@/path/to/schedule.pdf"
```

**Response:**
```json
{
  "success": true,
  "message": "Mass email job started successfully. Emails will be sent in the background.",
  "data": null,
  "path": "/api/admin/send-mass-email"
}
```

**Error Responses:**

| Code | Description                               |
|------|-------------------------------------------|
| 401  | Unauthorized - missing/invalid JWT        |
| 403  | Forbidden - user does not have ADMIN role |
| 400  | Bad Request - validation errors           |

## Security & Authorization

- Endpoint is protected by `@PreAuthorize("hasRole('ADMIN')")`
- Only users with `Role.ADMIN` can access admin endpoints
- All admin actions are logged for audit trail

## Async Processing

The mass email dispatch uses Spring's `@Async` mechanism:

- **Executor**: `taskExecutor` (defined in `AsyncConfig`)
  - Core pool size: 4
  - Max pool size: 8
  - Queue capacity: 500
  - Thread name prefix: `Async-`
  - Waits for tasks to complete on shutdown (60s timeout)
- **Non-blocking**: HTTP response returns immediately while emails send in background
- **Fault-tolerant**: Individual email failures don't abort the entire batch

## Email Templates

The mass email uses the `massEmailBroadcast` template with these variables:
- `subject` - Email subject line
- `body` - HTML body content

## Best Practices

1. **Use sparingly** - This feature bypasses user notification preferences
2. **Keep attachments small** - Large attachments impact delivery speed
3. **Monitor logs** - Check async thread logs for delivery failures
4. **Test first** - Send to `ADMIN` role first to verify content before broadcasting to all users
5. **HTML body** - The body field supports HTML for rich formatting

