# Kaleidoscope Rate Limiting System

## Overview
Kaleidoscope applies request rate limiting for sensitive authentication endpoints to reduce brute-force and abuse attempts while keeping normal usage smooth.

The implementation is done by `AuthRateLimitFilter` and is backed by Redis counters with key expiration.

## Where It Lives
- Filter: `auth/security/filter/AuthRateLimitFilter`
- Registration in security chain: `auth/config/SecurityConfig`
- Route constants: `auth/routes/AuthRoutes`

## Protected Endpoints
Rate limiting is currently applied to:

- `POST /api/auth/login`
- `POST /api/auth/register`

Other auth endpoints are currently not rate limited by this filter.

## Current Limits

### Login
- Limit: **5 attempts**
- Window: **15 minutes**
- Redis key pattern: `rate_limit:login:{clientIp}`

### Register
- Limit: **10 attempts**
- Window: **15 minutes**
- Redis key pattern: `rate_limit:register:{clientIp}`

## How It Works
1. The filter runs for each request before username/password authentication.
2. `OPTIONS` requests are skipped.
3. The filter checks if the request path matches login or register routes.
4. It increments a Redis counter for that action and IP.
5. On first increment, it sets TTL to the configured window.
6. If counter exceeds the limit, it returns HTTP `429` and does not continue the filter chain.

## Client IP Resolution
Client IP is resolved in this order:

1. `request.getRemoteAddr()` (default)
2. If the remote address is a trusted proxy, then:
   - first IP in `X-Forwarded-For`
   - else `X-Real-IP`
   - else fallback to remote address

Trusted proxies are configured via:

- Property: `security.rate-limit.trusted-proxies`
- Default: `127.0.0.1,::1`

## Response Format on Throttle
When limited, the API returns:

```json
{
  "status": 429,
  "message": "Too many registration attempts. Please try again later."
}
```

For login, the message is:

`Too many login attempts. Please try again later.`

## Operational Notes
- Counters are per action and per client IP.
- Local testing can quickly hit limits because all requests often come from one IP.
- Existing Redis counters continue until TTL expiry even after code changes.

## Troubleshooting

### Why did users suddenly get 429?
Common causes:
- Threshold is too strict for test environments.
- Multiple users share one IP (NAT, office gateway, local reverse proxy).
- `X-Forwarded-For` is missing or untrusted proxy list is incorrect.

### How to unblock quickly in local/dev
- Wait for TTL to expire, or
- Delete matching Redis keys (for example `rate_limit:register:*` and `rate_limit:login:*`), or
- Restart Redis in local environments.

## Recommended Next Improvements
- Move `LOGIN_LIMIT`, `LOGIN_WINDOW`, `REGISTER_LIMIT`, and `REGISTER_WINDOW` to application properties.
- Add endpoint-specific metrics (`429` count, top throttled IPs).
- Add tests for proxy IP resolution and TTL behavior.
