package com.kaleidoscope.backend.auth.config;

import com.kaleidoscope.backend.auth.routes.AuthRoutes;
import com.kaleidoscope.backend.auth.security.CustomAccessDeniedHandler;
import com.kaleidoscope.backend.auth.security.jwt.AuthEntryPointJwt;
import com.kaleidoscope.backend.auth.security.jwt.AuthTokenFilter;
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
import org.springframework.security.web.context.SecurityContextHolderFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Slf4j
public class SecurityConfig {
    private final AuthEntryPointJwt unauthorizedHandler;
    private final AuthTokenFilter authTokenFilter;
    private final CorrelationIdFilter correlationIdFilter;
    private final CorsConfig corsConfig;

    public SecurityConfig(
            AuthEntryPointJwt unauthorizedHandler,
            AuthTokenFilter authTokenFilter,
            CorrelationIdFilter correlationIdFilter,
            CorsConfig corsConfig
    ) {
        this.unauthorizedHandler = unauthorizedHandler;
        this.authTokenFilter = authTokenFilter;
        this.correlationIdFilter = correlationIdFilter;
        this.corsConfig = corsConfig;

        log.info("SecurityConfig initialized with CorrelationIdFilter and AuthTokenFilter");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CustomAccessDeniedHandler customAccessDeniedHandler) throws Exception {
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
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler)
                        .accessDeniedHandler(customAccessDeniedHandler)
                )
                .csrf(AbstractHttpConfigurer::disable)
                // Add CorrelationIdFilter before SecurityContextHolderFilter (modern replacement for SecurityContextPersistenceFilter)
                .addFilterBefore(correlationIdFilter, SecurityContextHolderFilter.class)
                // Add AuthTokenFilter before UsernamePasswordAuthenticationFilter (as originally configured)
                .addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class)
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