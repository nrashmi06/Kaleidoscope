package com.kaleidoscope.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "spring.app")
@Getter
@Setter
public class ApplicationProperties {
    private String baseUrl;
    private int cookieMaxAgeDays = 7; // Default: 7 days
}