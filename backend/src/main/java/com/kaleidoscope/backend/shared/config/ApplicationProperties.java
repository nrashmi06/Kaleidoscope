package com.kaleidoscope.backend.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "spring.app")
public record ApplicationProperties(
    String baseUrl
) {
}