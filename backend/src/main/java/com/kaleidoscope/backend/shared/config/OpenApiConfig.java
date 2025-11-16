package com.kaleidoscope.backend.shared.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
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
    // No custom OpenAPI bean needed.
    // Springdoc will auto-configure server URLs based on
    // Nginx proxy headers (e.g., X-Forwarded-Host).
}