package com.kaleidoscope.backend.shared.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Kaleidoscope API",
                version = "1.0.0",
                description = "Enterprise photo-sharing platform API for fostering cultural connection and community building among employees",
                contact = @Contact(
                        name = "Kaleidoscope Development Team",
                        email = "nnm22ad041@nmamit.in"
                ),
                license = @License(
                        name = "MIT License",
                        url = "https://opensource.org/licenses/MIT"
                )
        ),
        security = {
                @SecurityRequirement(name = "Bearer Authentication"),
                @SecurityRequirement(name = "Cookie Authentication")
        }
)
@SecurityScheme(
        name = "Bearer Authentication",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "JWT Bearer token authentication"
)
@SecurityScheme(
        name = "Cookie Authentication",
        type = SecuritySchemeType.APIKEY,
        in = io.swagger.v3.oas.annotations.enums.SecuritySchemeIn.COOKIE,
        paramName = "refreshToken", // Correctly set to the cookie name
        description = "HTTP-only cookie for refresh token"
)
public class OpenApiConfig {

    @Value("${spring.app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Bean
    public OpenAPI customOpenAPI() {
        // Use base URL only - nginx handles the /kaleidoscope context path internally
        // Frontend sees: https://project-kaleidoscope.tech/api/*
        // Nginx translates to: http://app:8080/kaleidoscope/api/*

        Server server = new Server();
        server.setUrl(baseUrl);
        server.setDescription("Kaleidoscope API Server");

        return new OpenAPI()
                .servers(List.of(server));
    }
}