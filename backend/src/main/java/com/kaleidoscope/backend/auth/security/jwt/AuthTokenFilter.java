package com.kaleidoscope.backend.auth.security.jwt;

import io.jsonwebtoken.ExpiredJwtException;
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
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class AuthTokenFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;
    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    public AuthTokenFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    private static final String CONTEXT_PATH = "/mental-health";
    private static final List<String> EXCLUDED_URLS = Arrays.asList(

    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        logger.debug("AuthTokenFilter called for URI: {}", request.getRequestURI());

        String requestURI = request.getRequestURI();

        if (EXCLUDED_URLS.contains(requestURI) || requestURI.contains(CONTEXT_PATH + "/chat")) {
            logger.debug("Skipping JWT validation for excluded URL: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = parseJwt(request);
            logger.debug("Received JWT token: {}", jwt);

            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String email = jwtUtils.getUserNameFromJwtToken(jwt);
                String role = jwtUtils.getRoleFromJwtToken(jwt);
                logger.debug("JWT validated for user: {} with role: {}", email, role);

                // Create UserDetails from JWT claims
                UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                        .username(email)
                        .authorities(new SimpleGrantedAuthority(role))
                        .password("")
                        .build();

                // Set authentication context
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);


                logger.debug("User authenticated: {}", email);
            } else {
                logger.debug("Invalid or missing JWT token");
                SecurityContextHolder.clearContext();
            }

            // Always continue the filter chain
            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException ex) {
            logger.warn("JWT expired: {}", ex.getMessage());
            String email = ex.getClaims().getSubject();
            SecurityContextHolder.clearContext();
            request.setAttribute("expired", true);
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            logger.error("Error processing JWT: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
        }
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        logger.debug("Authorization Header: {}", headerAuth);

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }

}
