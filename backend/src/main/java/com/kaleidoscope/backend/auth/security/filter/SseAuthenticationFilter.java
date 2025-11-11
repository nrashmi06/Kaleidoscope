package com.kaleidoscope.backend.auth.security.filter;

import com.kaleidoscope.backend.notifications.routes.NotificationRoutes;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
public class SseAuthenticationFilter extends OncePerRequestFilter {

    private final StringRedisTemplate stringRedisTemplate;
    private final UserRepository userRepository;

    public SseAuthenticationFilter(StringRedisTemplate stringRedisTemplate, UserRepository userRepository) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (response.isCommitted()) {
            log.trace("Response already committed, skipping SseAuthenticationFilter for {}", request.getRequestURI());
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            log.debug("Security context already contains authentication, skipping SseAuthenticationFilter");
            filterChain.doFilter(request, response);
            return;
        }

        if (request.getRequestURI().contains(NotificationRoutes.STREAM)) {
            String ticket = request.getParameter("ticket");

            if (ticket == null || ticket.isEmpty()) {
                log.error("✗ SSE connection attempt failed | reason: Missing ticket parameter | uri: {}",
                        request.getRequestURI());
                if (!response.isCommitted()) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Ticket is required for SSE connection\"}");
                    response.getWriter().flush();
                }
                return;
            }

            log.debug("SSE connection attempt | ticket: {}... | uri: {}",
                    ticket.substring(0, Math.min(8, ticket.length())), request.getRequestURI());

            try {
                String redisKey = "sse-ticket:" + ticket;

                log.debug("Attempting to retrieve and delete ticket from Redis | redisKey: {}", redisKey);

                // 1. Atomically get and delete the ticket from Redis.
                // This ensures it's single-use.
                String userIdStr = stringRedisTemplate.opsForValue().getAndDelete(redisKey);

                if (userIdStr != null && !userIdStr.isEmpty()) {
                    Long userId = Long.parseLong(userIdStr);

                    log.info("✓ SSE ticket successfully retrieved and deleted from Redis | redisKey: {} | userId: {} | ticket: {}...",
                            redisKey, userId, ticket.substring(0, Math.min(8, ticket.length())));

                    // 2. Fetch the User from the database
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found for SSE ticket userId: " + userId));

                    String email = user.getEmail();
                    String role = "ROLE_" + user.getRole().name();

                    log.debug("SSE ticket authentication successful | email: {} | role: {} | userId: {}",
                            email, role, userId);

                    request.setAttribute("userId", userId);

                    // 3. Create UserDetails from the fetched User
                    UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                            .username(email)
                            .authorities(new SimpleGrantedAuthority(role))
                            .password("") // Password is not needed
                            .build();

                    // 4. Set authentication context
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.info("✓ SSE authentication context established | email: {} | userId: {} | ticket consumed and deleted",
                            email, userId);
                } else {
                    log.warn("✗ SSE ticket validation failed | redisKey: {} | reason: Invalid, expired, or already used ticket | ticket: {}...",
                            redisKey, ticket.substring(0, Math.min(8, ticket.length())));
                    log.debug("Ticket retrieval returned null or empty | This could mean: 1) Ticket never existed, 2) Already used (deleted), or 3) Expired (30s TTL)");

                    if (!response.isCommitted()) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Invalid or expired ticket\"}");
                        response.getWriter().flush();
                    }
                    return;
                }

                try {
                    filterChain.doFilter(request, response);
                } catch (Exception e) {
                    if (response.isCommitted()) {
                        log.debug("Exception during SSE processing (response already committed): {}", e.getMessage());
                    } else {
                        log.error("✗ Exception during SSE filter chain processing: {}", e.getMessage(), e);
                        throw e;
                    }
                }
            } catch (Exception e) {
                log.error("✗ SSE authentication failed | error: {} | ticket: {}...",
                        e.getMessage(),
                        ticket != null ? ticket.substring(0, Math.min(8, ticket.length())) : "null",
                        e);
                if (!response.isCommitted()) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Authentication failed: " + e.getMessage() + "\"}");
                    response.getWriter().flush();
                }
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
}

