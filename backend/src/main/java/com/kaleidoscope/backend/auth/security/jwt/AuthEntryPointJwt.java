package com.kaleidoscope.backend.auth.security.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.auth.exception.token.JwtTokenExpiredException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {
    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);
    private final ObjectMapper objectMapper;

    public AuthEntryPointJwt(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        // Log at debug level instead of error since this might be expected behavior
        logger.debug("Auth entry point triggered for path: {}", request.getServletPath());

        try {
            if (!response.isCommitted()) {
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

                Map<String, Object> body = new HashMap<>();
                body.put("status", HttpServletResponse.SC_UNAUTHORIZED);
                body.put("error", "Unauthorized");
                body.put("path", request.getServletPath());

                // More specific error message handling
                String message;
                if (request.getAttribute("expired") != null && (Boolean)request.getAttribute("expired")) {
                    message = "JWT token has expired. Please renew your token.";
                    logger.debug("JWT token expired for request: {}", request.getServletPath());
                } else if (authException.getCause() instanceof JwtTokenExpiredException) {
                    message = "JWT token has expired. Please renew your token.";
                    logger.debug("JWT token expired exception for request: {}", request.getServletPath());
                } else {
                    String customMessage = (String) request.getAttribute("auth_error_message");
                    message = customMessage != null ? customMessage : "Authentication failed";
                    logger.debug("Authentication failed for request: {} - {}",
                            request.getServletPath(), message);
                }

                body.put("message", message);

                objectMapper.writeValue(response.getOutputStream(), body);
            } else {
                logger.debug("Response already committed for path: {}", request.getServletPath());
            }
        } catch (Exception e) {
            // Prevent exception stack trace from being logged
            logger.warn("Error while handling authentication failure for path {}: {}",
                    request.getServletPath(), e.getMessage());
        }
    }
}