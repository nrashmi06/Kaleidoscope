package com.kaleidoscope.backend.shared.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Enhanced filter for correlation ID and request enrichment.
 * Captures client details for Logstash geolocation and user agent parsing.
 */
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        Instant startTime = Instant.now();

        try {
            // Handle correlation ID
            String correlationId = request.getHeader(CORRELATION_ID_HEADER);
            if (correlationId == null || correlationId.trim().isEmpty()) {
                correlationId = UUID.randomUUID().toString();
            }

            // Add correlation ID to MDC and response header
            MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
            response.setHeader(CORRELATION_ID_HEADER, correlationId);

            // Capture request details for Logstash enrichment
            MDC.put("requestMethod", request.getMethod());
            MDC.put("requestUri", request.getRequestURI());
            MDC.put("requestUrl", request.getRequestURL().toString());

            // Capture client IP (handles X-Forwarded-For, X-Real-IP)
            String clientIp = getClientIpAddress(request);
            MDC.put("clientIp", clientIp);

            // Capture User Agent for browser/device detection
            String userAgent = request.getHeader("User-Agent");
            if (userAgent != null && !userAgent.trim().isEmpty()) {
                MDC.put("userAgent", userAgent);
            }

            // Capture additional request headers that might be useful
            String referer = request.getHeader("Referer");
            if (referer != null && !referer.trim().isEmpty()) {
                MDC.put("referer", referer);
            }

            // Capture session ID if available
            if (request.getSession(false) != null) {
                MDC.put("sessionId", request.getSession().getId());
            }

            // Continue with the filter chain
            filterChain.doFilter(request, response);

            // Capture response details after the chain has completed
            Duration duration = Duration.between(startTime, Instant.now());
            MDC.put("responseStatus", String.valueOf(response.getStatus()));
            MDC.put("responseTimeMs", String.valueOf(duration.toMillis()));

        } finally {
            // **THE FIX:** Use MDC.clear() for robust cleanup
            MDC.clear();
        }
    }

    /**
     * Extract client IP address handling various proxy headers
     */
    private String getClientIpAddress(HttpServletRequest request) {
        // Check X-Forwarded-For header (most common)
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp != null && !clientIp.isEmpty() && !"unknown".equalsIgnoreCase(clientIp)) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return clientIp.split(",")[0].trim();
        }
        // Check other common proxy headers
        clientIp = request.getHeader("X-Real-IP");
        if (clientIp != null && !clientIp.isEmpty() && !"unknown".equalsIgnoreCase(clientIp)) {
            return clientIp;
        }
        // Fall back to the direct remote address
        return request.getRemoteAddr();
    }
}