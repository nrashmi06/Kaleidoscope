# SSE Ticket Authentication Lifecycle

## Overview
The SSE (Server-Sent Events) ticket system provides a secure, one-time authentication mechanism for establishing SSE connections without exposing JWT tokens in URLs.

## Ticket Lifecycle Stages

### 1. **Ticket Generation** (AuthServiceImpl.generateSseTicket())
**When:** User makes authenticated POST request to `/api/auth/sse-ticket`

**What happens:**
1. Extract userId from JWT authentication context
2. Generate unique UUID ticket
3. Store in Redis with key: `sse-ticket:{uuid}`
4. Value stored: `userId` (as string)
5. TTL: **30 seconds**

**Logs:**
```
INFO  - ✓ SSE ticket generated and stored successfully | userId: 1 | redisKey: sse-ticket:abc123... | TTL: 30s
DEBUG - Full ticket details | userId: 1 | ticket: abc12345-6789-... | expiresIn: 30 seconds
```

**Response:**
```json
{
  "data": {
    "ticket": "abc12345-6789-abcd-ef01-234567890abc"
  },
  "message": "SSE ticket generated successfully"
}
```

---

### 2. **Ticket Consumption** (SseAuthenticationFilter.doFilterInternal())
**When:** Client connects to SSE endpoint `/api/notifications/stream?ticket={ticket}`

**What happens:**
1. Extract ticket from query parameter
2. Construct Redis key: `sse-ticket:{ticket}`
3. **Atomically retrieve AND delete** from Redis using `getAndDelete()`
4. If ticket found:
   - Parse userId from Redis value
   - Fetch User from database
   - Set Spring Security authentication context
   - Allow SSE connection to proceed
5. If ticket NOT found (null/empty):
   - Return 401 Unauthorized
   - Reason: Invalid, expired, or already used

**Logs (Success):**
```
DEBUG - SSE connection attempt | ticket: abc12345... | uri: /api/notifications/stream
DEBUG - Attempting to retrieve and delete ticket from Redis | redisKey: sse-ticket:abc12345...
INFO  - ✓ SSE ticket successfully retrieved and deleted from Redis | redisKey: sse-ticket:abc12345... | userId: 1
INFO  - ✓ SSE authentication context established | email: user@example.com | userId: 1 | ticket consumed and deleted
```

**Logs (Failure):**
```
WARN  - ✗ SSE ticket validation failed | redisKey: sse-ticket:xyz... | reason: Invalid, expired, or already used
DEBUG - Ticket retrieval returned null or empty | This could mean: 1) Ticket never existed, 2) Already used (deleted), or 3) Expired (30s TTL)
```

---

## Ticket Deletion Scenarios

### ✅ Scenario 1: **Successful Use (Normal Flow)**
- **When:** Client uses ticket to connect to SSE endpoint
- **How:** `stringRedisTemplate.opsForValue().getAndDelete(redisKey)`
- **Result:** Ticket is atomically retrieved and deleted in single operation
- **Timing:** Happens immediately when SSE connection is established
- **Log:** `✓ SSE ticket successfully retrieved and deleted from Redis`

### ⏰ Scenario 2: **Expiration (Timeout)**
- **When:** 30 seconds pass after ticket generation
- **How:** Redis TTL automatic expiration
- **Result:** Redis automatically removes the key
- **Timing:** 30 seconds after generation if not used
- **Log:** No explicit log (Redis internal operation)
- **User Impact:** Next connection attempt returns "Invalid or expired ticket"

### 🔄 Scenario 3: **Double-Use Attempt**
- **When:** Client tries to reuse an already-consumed ticket
- **How:** `getAndDelete()` returns null (ticket already deleted)
- **Result:** 401 Unauthorized response
- **Log:** `✗ SSE ticket validation failed | reason: Invalid, expired, or already used`

---

## Security Features

### 🔒 One-Time Use
The `getAndDelete()` operation ensures tickets cannot be reused:
- First use: Retrieves userId and deletes ticket ✓
- Second use: Returns null (already deleted) ✗

### ⏱️ Short Lifespan
30-second TTL limits the attack window:
- Client must use ticket within 30 seconds
- Prevents long-term replay attacks
- Forces fresh authentication for each connection

### 🔐 No Token Exposure
Unlike JWT-in-URL approach:
- Ticket is separate from JWT
- Ticket is single-use and short-lived
- JWT never appears in URL/query parameters
- No risk of JWT leaking in browser history, logs, or proxies

---

## Client Usage Flow

```javascript
// Step 1: Get authenticated and request ticket
const response = await fetch('/api/auth/sse-ticket', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}` // JWT required here
  }
});
const { ticket } = await response.json();

// Step 2: Immediately connect to SSE using ticket
const eventSource = new EventSource(`/api/notifications/stream?ticket=${ticket}`);

// Ticket is now consumed and deleted - cannot be reused
```

---

## Troubleshooting

### Error: "Invalid or expired ticket"
**Possible causes:**
1. Ticket expired (>30 seconds old)
2. Ticket already used
3. Ticket never existed (wrong value)
4. Redis connection issue

**Solution:**
- Request a new ticket from `/api/auth/sse-ticket`
- Ensure ticket is used immediately after generation
- Check Redis connectivity

### Error: "Ticket is required for SSE connection"
**Cause:** Missing `ticket` query parameter

**Solution:**
- Include `?ticket={value}` in SSE connection URL

### Error: "User not authenticated" (during ticket generation)
**Cause:** No valid JWT in Authorization header

**Solution:**
- Ensure user is logged in
- Include valid Bearer token in POST request to `/api/auth/sse-ticket`

---

## Configuration

### Redis TTL
Current: **30 seconds**
Location: `AuthServiceImpl.generateSseTicket()`
```java
stringRedisTemplate.opsForValue().set(redisKey, userId.toString(), 30, TimeUnit.SECONDS);
```

### Redis Key Pattern
- Prefix: `sse-ticket:`
- Format: `sse-ticket:{uuid}`
- Example: `sse-ticket:abc12345-6789-abcd-ef01-234567890abc`

### Security Config
GET requests to `/api/auth/sse-ticket` are permitted (for graceful error handling):
```java
.requestMatchers(HttpMethod.GET, AuthRoutes.GENERATE_SSE_TICKET).permitAll()
```
This allows proper "405 Method Not Allowed" errors instead of "401 Unauthorized".

---

## Monitoring

### Key Metrics to Track
1. **Ticket generation rate**: How many tickets/second
2. **Ticket usage rate**: Success vs. expired/invalid
3. **Time to consumption**: Average time between generation and use
4. **Double-use attempts**: Security indicator

### Log Patterns

**Generation:**
```
✓ SSE ticket generated and stored successfully | userId: {id} | redisKey: {key} | TTL: 30s
```

**Successful Use:**
```
✓ SSE ticket successfully retrieved and deleted from Redis | redisKey: {key} | userId: {id}
✓ SSE authentication context established | email: {email} | userId: {id} | ticket consumed and deleted
```

**Failed Use:**
```
✗ SSE ticket validation failed | redisKey: {key} | reason: Invalid, expired, or already used ticket
```

**Redis Errors:**
```
✗ Failed to store SSE ticket in Redis | userId: {id} | error: {message}
```

