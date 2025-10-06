package com.kaleidoscope.backend.auth.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@Slf4j
public class CorsConfig {
    private final String allowedOrigins;

    public CorsConfig(@Value("${allowed.origins}") String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .toList();

        log.info("Configuring CORS with allowed origins: {}", origins);
        configuration.setAllowedOrigins(origins);

        List<String> methods = Arrays.asList(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.OPTIONS.name(),
                HttpMethod.PATCH.name()
        );

        log.debug("Allowed methods: {}", methods);
        configuration.setAllowedMethods(methods);

        // Added cookie-related headers
        List<String> allowedHeaders = Arrays.asList(
                HttpHeaders.AUTHORIZATION,
                HttpHeaders.CONTENT_TYPE,
                "X-Requested-With",
                "accept",
                HttpHeaders.ORIGIN,
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers",
                HttpHeaders.IF_NONE_MATCH,
                HttpHeaders.COOKIE,              // Added for cookie support
                "Set-Cookie"                    // Added for cookie support
        );
        log.debug("Allowed headers: {}", allowedHeaders);
        configuration.setAllowedHeaders(allowedHeaders);

        List<String> exposedHeaders = Arrays.asList(
                HttpHeaders.AUTHORIZATION,
                HttpHeaders.CONTENT_TYPE,
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials",
                HttpHeaders.ETAG,
                "Set-Cookie",                    // Added for cookie support
                "Access-Control-Allow-Headers",  // Added for cookie support
                "Access-Control-Allow-Methods",  // Added for preflight requests
                "Access-Control-Max-Age"         // Added for preflight requests
        );
        log.debug("Exposed headers: {}", exposedHeaders);
        configuration.setExposedHeaders(exposedHeaders);

        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        log.info("CORS configuration completed with cookie support enabled");
        return source;
    }

    @Bean
    public CorsFilter corsFilter() {
        log.debug("Creating CORS filter");
        return new CorsFilter(corsConfigurationSource());
    }
}