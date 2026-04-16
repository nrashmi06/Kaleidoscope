package com.kaleidoscope.backend.auth.security.filter;

import com.kaleidoscope.backend.auth.routes.AuthRoutes;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthRateLimitFilter extends OncePerRequestFilter {

    @Value("${security.rate-limit.login.limit:30}")
    private int loginLimit;

    @Value("${security.rate-limit.login.window:PT1H}")
    private Duration loginWindow;

    @Value("${security.rate-limit.register.limit:15}")
    private int registerLimit;

    @Value("${security.rate-limit.register.window:PT1H}")
    private Duration registerWindow;

    private final StringRedisTemplate stringRedisTemplate;
    private Set<String> trustedProxyIps = Set.of("127.0.0.1", "::1");

    @Value("${security.rate-limit.trusted-proxies:127.0.0.1,::1}")
    void setTrustedProxyIps(String trustedProxyIpsConfig) {
        this.trustedProxyIps = Arrays.stream(trustedProxyIpsConfig.split(","))
                .map(String::trim)
                .filter(ip -> !ip.isBlank())
                .collect(Collectors.toSet());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getServletPath();
        String clientIp = resolveClientIp(request);

        if (AuthRoutes.LOGIN.equals(path)) {
            if (isRateLimited("login", clientIp, loginLimit, loginWindow)) {
                writeRateLimitedResponse(response, "Too many login attempts. Please try again later.");
                return;
            }
        } else if (AuthRoutes.REGISTER.equals(path)) {
            if (isRateLimited("register", clientIp, registerLimit, registerWindow)) {
                writeRateLimitedResponse(response, "Too many registration attempts. Please try again later.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(String action, String clientIp, int limit, Duration window) {
        String key = String.format("rate_limit:%s:%s", action, clientIp);

        Long attempts = stringRedisTemplate.opsForValue().increment(key);
        if (attempts == null) {
            return false;
        }

        if (attempts == 1L) {
            stringRedisTemplate.expire(key, window);
        }

        boolean limited = attempts > limit;
        if (limited) {
            log.warn("Rate limit exceeded for action={} ip={} attempts={} limit={}",
                    action, clientIp, attempts, limit);
        }

        return limited;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr == null || !trustedProxyIps.contains(remoteAddr)) {
            return remoteAddr;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String[] ips = forwardedFor.split(",");
            if (ips.length > 0) {
                return ips[0].trim();
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return remoteAddr;
    }

    private void writeRateLimitedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"status\":429,\"message\":\"" + message + "\"}");
    }
}