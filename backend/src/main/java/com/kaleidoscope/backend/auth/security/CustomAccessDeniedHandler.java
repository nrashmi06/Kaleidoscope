package com.kaleidoscope.backend.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {
    private static final Logger logger = LoggerFactory.getLogger(CustomAccessDeniedHandler.class);
    private final ObjectMapper objectMapper;

    public CustomAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) {
        try {
            // Most important change: Check if response is already committed
            if (response.isCommitted()) {
                logger.debug("Response already committed, skipping access denied handling for path: {}",
                        request.getServletPath());
                return;  // Exit early if response is committed
            }

            // Reset buffer and headers if anything was written
            response.resetBuffer();
            response.reset();

            // Set response headers
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);

            Map<String, Object> body = new HashMap<>();
            body.put("status", HttpServletResponse.SC_FORBIDDEN);
            body.put("error", "Forbidden");
            body.put("message", "Access denied: Insufficient permissions");
            body.put("path", request.getServletPath());
            body.put("timestamp", System.currentTimeMillis());

            objectMapper.writeValue(response.getOutputStream(), body);
            response.flushBuffer();  // Ensure everything is written

        } catch (Exception ex) {
            // Log at debug level to avoid stack trace spam
            logger.debug("Could not handle access denied for path {}: {}",
                    request.getServletPath(),
                    ex.getMessage());
        }
    }
}