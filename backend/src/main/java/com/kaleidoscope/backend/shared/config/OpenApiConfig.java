package com.kaleidoscope.backend.shared.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Kaleidoscope API",
        version = "1.0.0",
        description = "Enterprise photo-sharing platform API for fostering cultural connection and community building among employees",
        contact = @Contact(
            name = "Kaleidoscope Development Team",
            email = "support@kaleidoscope.com"
        ),
        license = @License(
            name = "MIT License",
            url = "https://opensource.org/licenses/MIT"
        )
    ),
    servers = {
        @Server(url = "http://localhost:8080", description = "Development Server"),
        @Server(url = "https://api.kaleidoscope.com", description = "Production Server")
    },
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
    // Configuration is handled via annotations
}
