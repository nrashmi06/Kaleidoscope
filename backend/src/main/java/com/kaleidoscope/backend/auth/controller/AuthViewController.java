package com.kaleidoscope.backend.auth.controller;

import com.kaleidoscope.backend.auth.routes.AuthRoutes;
import com.kaleidoscope.backend.auth.service.AuthService;
import com.kaleidoscope.backend.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@Slf4j
@Tag(name = "Authentication Views", description = "View controllers for authentication-related pages")
public class AuthViewController {

    private final AuthService authService;
    private final UserService userService;

    public AuthViewController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @Operation(summary = "Verify email address", description = "Verifies user email address using verification token and displays result page.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Email verification page displayed (success or error)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid verification token")
    })
    @GetMapping(AuthRoutes.VERIFY_EMAIL)
    @PreAuthorize("permitAll()")
    public String verifyEmail(
            @Parameter(description = "Email verification token", required = true)
            @RequestParam String token,
            Model model) {

        log.debug("Processing email verification with token: {}", token);

        try {
            authService.verifyUser(token);
            log.info("Email verification successful");
            model.addAttribute("title", "Email Verification");
            model.addAttribute("status", "success");
            model.addAttribute("message", "Your email has been successfully verified. You can now login to your account.");
            return "emailVerified";
        } catch (Exception e) {
            log.error("Email verification failed: {}", e.getMessage());
            model.addAttribute("title", "Email Verification Failed");
            model.addAttribute("status", "error");
            model.addAttribute("message", "Email verification failed: " + e.getMessage());
            model.addAttribute("errorDetails", e.getClass().getSimpleName());
            return "emailVerificationError";
        }
    }
}