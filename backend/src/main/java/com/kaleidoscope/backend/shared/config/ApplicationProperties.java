package com.kaleidoscope.backend.shared.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "spring.app")
@Getter
@Setter
public class ApplicationProperties {
    private String baseUrl;
}