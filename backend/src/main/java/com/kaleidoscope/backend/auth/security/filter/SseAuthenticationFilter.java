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

        // Skip JWT/SSE processing if already authenticated (e.g., via regular JWT header)
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            log.debug("Security context already contains authentication, skipping SseAuthenticationFilter");
            filterChain.doFilter(request, response);
            return;
        }

        // Only process SSE stream endpoint with token query parameter
        if (request.getRequestURI().endsWith(NotificationRoutes.STREAM)) {
            String token = request.getParameter("token");

            if (token == null || token.isEmpty()) {
                log.error("Token is required for SSE connection but was not provided");
                throw new ServletException("Token is required for SSE connection");
            }

            try {
                if (jwtUtils.validateJwtToken(token)) {
                    String email = jwtUtils.getUserNameFromJwtToken(token);
                    String role = jwtUtils.getRoleFromJwtToken(token);

                    log.debug("SSE authentication successful for user: {} with role: {}", email, role);

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

                    log.info("SSE authentication context set for user: {}", email);
                }
                filterChain.doFilter(request, response);
            } catch (Exception e) {
                log.error("SSE authentication failed: {}", e.getMessage(), e);
                throw new ServletException("Authentication failed: " + e.getMessage());
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
}
