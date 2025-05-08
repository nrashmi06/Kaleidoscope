//package com.kaleidoscope.backend.auth.security.filter;
//
//import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import org.springframework.context.annotation.Lazy;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.core.authority.SimpleGrantedAuthority;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.stereotype.Component;
//import org.springframework.web.filter.OncePerRequestFilter;
//
//import java.io.IOException;
//
//@Component
//public class SseAuthenticationFilter extends OncePerRequestFilter {
//
//    private final JwtUtils jwtUtils;
//    private final UserService userService;
//
//    public SseAuthenticationFilter(JwtUtils jwtUtils, @Lazy UserService userService) {
//        this.jwtUtils = jwtUtils;
//        this.userService = userService;
//    }
//
//    @Override
//    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
//            throws ServletException, IOException {
//        if (SecurityContextHolder.getContext().getAuthentication() != null) {
//            // Skip JWT/SSE processing if already authenticated (e.g., via API key)
//            filterChain.doFilter(request, response);
//            return;
//        }
//        if (request.getRequestURI().contains("/subscribe")) {
//            String token = request.getParameter("token");
//
//            if (token == null || token.isEmpty()) {
//                throw new ServletException("Token is required for SSE connection");
//            }
//
//            try {
//                if (jwtUtils.validateJwtToken(token)) {
//                    String email = jwtUtils.getUserNameFromJwtToken(token);
//                    String role = jwtUtils.getRoleFromJwtToken(token);
//
//                    // Create UserDetails from JWT claims
//                    UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
//                            .username(email)
//                            .authorities(new SimpleGrantedAuthority(role))
//                            .password("") // Password is not needed for JWT-based auth
//                            .build();
//
//                    // Set authentication context
//                    UsernamePasswordAuthenticationToken authentication =
//                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
//                    SecurityContextHolder.getContext().setAuthentication(authentication);
//                    filterChain.doFilter(request, response);
//                } else {
//                    throw new ServletException("Invalid token");
//                }
//            } catch (Exception e) {
//                throw new ServletException("Authentication failed: " + e.getMessage());
//            }
//        } else {
//            filterChain.doFilter(request, response);
//        }
//    }
//}