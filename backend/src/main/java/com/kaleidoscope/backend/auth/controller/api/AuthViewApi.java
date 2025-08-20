package com.kaleidoscope.backend.auth.controller.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "Authentication Views", description = "View controllers for authentication-related pages")
public interface AuthViewApi {

    @Operation(summary = "Verify email address", description = "Verifies user email address using verification token and displays result page.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Email verification page displayed (success or error)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid verification token")
    })
    String verifyEmail(
            @Parameter(description = "Email verification token", required = true)
            @RequestParam String token,
            Model model);
}
