package com.kaleidoscope.backend.auth.security.jwt;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class AuthTokenFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;
    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    public AuthTokenFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    // Keep excluded URLs if needed, otherwise remove
    // private static final String CONTEXT_PATH = "/kaleidoscope";
    // private static final List<String> EXCLUDED_URLS = Arrays.asList(...);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // If authentication already exists from a previous filter, skip JWT processing
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            logger.debug("Security context already contains authentication, skipping AuthTokenFilter.");
            filterChain.doFilter(request, response);
            return;
        }

        logger.debug("AuthTokenFilter called for URI: {}", request.getRequestURI());

        // Skip JWT validation for excluded URLs if necessary
        // String requestURI = request.getRequestURI();
        // if (EXCLUDED_URLS.contains(requestURI) || ...) { ... }

        String jwt = null;
        try {
            jwt = parseJwt(request); // Extract JWT
            logger.debug("Received JWT token: {}", (jwt != null ? jwt.substring(0, Math.min(jwt.length(), 10)) + "..." : "null"));

            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                // If JWT is valid, extract claims and set Authentication
                String email = jwtUtils.getUserNameFromJwtToken(jwt);
                String role = jwtUtils.getRoleFromJwtToken(jwt);
                logger.debug("JWT validated for user: {} with role: {}", email, role);

                UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                        .username(email)
                        .authorities(new SimpleGrantedAuthority(role))
                        .password("") // Password not needed for JWT auth
                        .build();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // *** Set the authentication in the context ***
                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.debug("User authenticated via JWT: {}", email);
            } else {
                // If JWT is null or invalid (but didn't throw JwtException)
                logger.debug("Invalid or missing JWT token, clearing context.");
                // It's generally safe to clear context if no valid JWT was found/validated initially
                SecurityContextHolder.clearContext();
            }

            // Continue the filter chain regardless of whether authentication was set
            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException ex) {
            // Specific handling for expired tokens
            logger.warn("JWT expired: {}. Setting request attribute 'expired'.", ex.getMessage());
            SecurityContextHolder.clearContext(); // Clear context on expiration
            request.setAttribute("expired", true); // Signal to AuthEntryPointJwt
            filterChain.doFilter(request, response); // Continue chain to let EntryPoint handle it
        } catch (JwtException ex) {
            // Handle other JWT-specific exceptions (Malformed, Unsupported, Signature, etc.)
            logger.error("Invalid JWT: {}", ex.getMessage());
            SecurityContextHolder.clearContext(); // Clear context on invalid JWT
            request.setAttribute("auth_error_message", "Invalid JWT token: " + ex.getMessage()); // Provide specific message
            // Allow the request to proceed to the AuthEntryPointJwt by continuing the filter chain
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            // --- Improved Generic Error Handling ---
            // Catch other unexpected exceptions that might occur *during* filter processing
            // BUT DO NOT clear the SecurityContextHolder here unless the error is fundamentally
            // related to authentication setup itself. Let downstream errors propagate.
            logger.error("Unexpected error during AuthTokenFilter processing for URI {}: {}", request.getRequestURI(), e.getMessage(), e);

            // Do NOT clear SecurityContextHolder here for non-JWT errors.
            // If authentication was set *before* this exception, it should remain.
            // If it wasn't set, it's already null/empty.

            // Re-throw the exception so it can be handled by global exception handlers
            // or Spring's default error handling, ensuring the request fails correctly.
            // This prevents the scenario where a downstream error (like DB or Elasticsearch)
            // incorrectly leads to an authentication failure message.
            if (e instanceof ServletException) {
                throw (ServletException) e;
            }
            if (e instanceof IOException) {
                throw (IOException) e;
            }
            throw new ServletException("Unexpected error in AuthTokenFilter: " + e.getMessage(), e);
        }
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        // logger.debug("Authorization Header: {}", headerAuth); // Can be noisy, keep if needed

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}