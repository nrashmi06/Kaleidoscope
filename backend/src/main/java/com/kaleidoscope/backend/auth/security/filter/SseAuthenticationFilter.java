package com.kaleidoscope.backend.auth.security.filter;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.notifications.routes.NotificationRoutes;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
public class SseAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    public SseAuthenticationFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip if response is already committed (e.g., SSE already started)
        if (response.isCommitted()) {
            log.trace("Response already committed, skipping SseAuthenticationFilter for {}", request.getRequestURI());
            return;
        }

        // Skip JWT/SSE processing if already authenticated (e.g., via regular JWT header)
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            log.debug("Security context already contains authentication, skipping SseAuthenticationFilter");
            filterChain.doFilter(request, response);
            return;
        }

        // Only process SSE stream endpoint with token query parameter
        if (request.getRequestURI().contains(NotificationRoutes.STREAM)) {
            String token = request.getParameter("token");

            if (token == null || token.isEmpty()) {
                log.error("Token is required for SSE connection but was not provided");

                // Only write error if response not committed
                if (!response.isCommitted()) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Token is required for SSE connection\"}");
                    response.getWriter().flush();
                }
                return; // Don't continue the filter chain
            }

            try {
                if (jwtUtils.validateJwtToken(token)) {
                    String email = jwtUtils.getUserNameFromJwtToken(token);
                    String role = jwtUtils.getRoleFromJwtToken(token);
                    Long userId = jwtUtils.getUserIdFromJwtToken(token);

                    log.debug("SSE authentication successful for user: {} with role: {}, userId: {}", email, role, userId);

                    // Store userId in request attributes for easy access
                    request.setAttribute("userId", userId);

                    // Create UserDetails from JWT claims
                    UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                            .username(email)
                            .authorities(new SimpleGrantedAuthority(role))
                            .password("") // Password is not needed for JWT-based auth
                            .build();

                    // Set authentication context
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.info("SSE authentication context set for user: {}, userId: {}", email, userId);
                } else {
                    log.error("SSE token validation failed for token: {}...",
                            token.length() > 10 ? token.substring(0, 10) : token);

                    // Only write error if response not committed
                    if (!response.isCommitted()) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Invalid JWT token\"}");
                        response.getWriter().flush();
                    }
                    return; // Don't continue the filter chain
                }

                // Continue filter chain, but catch any exceptions related to committed responses
                try {
                    filterChain.doFilter(request, response);
                } catch (Exception e) {
                    // If response is already committed (SSE started), just log and don't try to handle
                    if (response.isCommitted()) {
                        log.debug("Exception during SSE processing (response already committed): {}", e.getMessage());
                    } else {
                        throw e;
                    }
                }
            } catch (Exception e) {
                log.error("SSE authentication failed: {}", e.getMessage(), e);

                // Only write error if response not committed
                if (!response.isCommitted()) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Authentication failed: " + e.getMessage() + "\"}");
                    response.getWriter().flush();
                }
                // Don't continue the filter chain
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
}
