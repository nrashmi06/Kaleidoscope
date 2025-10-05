package com.kaleidoscope.backend.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
    String secret,
    int expiration, // in milliseconds
    int cookieMaxAgeDays // in days
) {
}