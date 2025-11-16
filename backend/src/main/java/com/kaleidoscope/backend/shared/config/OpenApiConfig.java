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
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
        bearerFormat = "JWT",
        scheme = "bearer",
        description = "JWT Bearer token authentication"
)
@SecurityScheme(
        name = "Cookie Authentication",
        type = SecuritySchemeType.APIKEY,
        in = io.swagger.v3.oas.annotations.enums.SecuritySchemeIn.COOKIE,
        paramName = "refreshToken",
        description = "HTTP-only cookie for refresh token"
)
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI(
            @org.springframework.beans.factory.annotation.Value("${spring.app.base-url:http://localhost:8080}") String baseUrl,
            @org.springframework.beans.factory.annotation.Value("${server.servlet.context-path:/kaleidoscope}") String contextPath
    ) {

        return new OpenAPI()
                .addServersItem(new Server()
                        .url(baseUrl) // <-- Use the base URL (e.g., https://project-kaleidoscope.tech)
                        .description("Production Server"))
                .addServersItem(new Server()
                        .url("/") // <-- Use a relative path from the root
                        .description("Relative Path (Alternative)"));
    }
}