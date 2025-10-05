package com.kaleidoscope.backend.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "server.servlet")
public record ServletProperties(
    String contextPath
) {
}