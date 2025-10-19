package com.kaleidoscope.backend.auth.config;

import com.kaleidoscope.backend.auth.routes.AuthRoutes;
import com.kaleidoscope.backend.auth.security.CustomAccessDeniedHandler;
import com.kaleidoscope.backend.auth.security.filter.SseAuthenticationFilter;
import com.kaleidoscope.backend.auth.security.jwt.AuthEntryPointJwt;
import com.kaleidoscope.backend.auth.security.jwt.AuthTokenFilter;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.notifications.routes.NotificationRoutes;
import com.kaleidoscope.backend.shared.config.CorrelationIdFilter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.HeaderWriterFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Slf4j
public class SecurityConfig {
    private final AuthEntryPointJwt unauthorizedHandler;
    private final CorrelationIdFilter correlationIdFilter;
    private final CorsConfig corsConfig;

    public SecurityConfig(
            AuthEntryPointJwt unauthorizedHandler,
            CorrelationIdFilter correlationIdFilter,
            CorsConfig corsConfig
    ) {
        this.unauthorizedHandler = unauthorizedHandler;
        this.correlationIdFilter = correlationIdFilter;
        this.corsConfig = corsConfig;

        log.info("SecurityConfig initialized with CorrelationIdFilter");
    }

    @Bean
    public AuthTokenFilter authTokenFilter(JwtUtils jwtUtils) {
        return new AuthTokenFilter(jwtUtils);
    }

    @Bean
    public SseAuthenticationFilter sseAuthenticationFilter(JwtUtils jwtUtils) {
        return new SseAuthenticationFilter(jwtUtils);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CustomAccessDeniedHandler customAccessDeniedHandler,
            AuthTokenFilter authTokenFilter,
            SseAuthenticationFilter sseAuthenticationFilter
    ) throws Exception {
        log.debug("Configuring security filter chain with correlation ID and authentication filters");

        return http
                .cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()))
                .authorizeHttpRequests(requests -> requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                AuthRoutes.FORGOT_PASSWORD,
                                AuthRoutes.RESET_PASSWORD,
                                AuthRoutes.REGISTER,
                                AuthRoutes.LOGIN,
                                AuthRoutes.RENEW_TOKEN,
                                AuthRoutes.VERIFY_EMAIL,
                                AuthRoutes.CHECK_USERNAME_AVAILABILITY,
                                AuthRoutes.RESEND_VERIFICATION_EMAIL,
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/api/public/**",
                                "/api/health",
                                "/actuator/health",
                                "/actuator/info"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, NotificationRoutes.STREAM).authenticated()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler)
                        .accessDeniedHandler(customAccessDeniedHandler)
                )
                .csrf(AbstractHttpConfigurer::disable)
                .addFilterBefore(correlationIdFilter, HeaderWriterFilter.class) // Run correlation ID very early
                .addFilterBefore(sseAuthenticationFilter, UsernamePasswordAuthenticationFilter.class) // SSE auth check
                .addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class) // Standard JWT auth check
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}