package com.kaleidoscope.backend.auth.controller.api;

import com.kaleidoscope.backend.auth.dto.request.*;
import com.kaleidoscope.backend.auth.dto.response.*;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Authentication", description = "APIs for user authentication and account management")
public interface AuthApi {

    @Operation(summary = "Register a new user", description = "Creates a new user account with optional profile picture.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User registered successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input or user already exists"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    ResponseEntity<ApiResponse<UserRegistrationResponseDTO>> registerUser(
            @Parameter(description = "Profile picture file (optional)")
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "User registration data", required = true,
                    content = @Content(schema = @Schema(implementation = UserRegistrationRequestDTO.class)))
            @RequestPart("userData") UserRegistrationRequestDTO userRegistrationDTO);

    @Operation(summary = "Login user", description = "Authenticates a user and returns access token with refresh token cookie.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input")
    })
    ResponseEntity<ApiResponse<UserLoginResponseDTO>> authenticateUser(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "User login credentials", required = true,
                    content = @Content(schema = @Schema(implementation = UserLoginRequestDTO.class)))
            @RequestBody UserLoginRequestDTO loginRequest,
            HttpServletResponse response);

    @Operation(summary = "Logout user", description = "Logs out the user by invalidating refresh token and clearing security context.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logout successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class)))
    })
    ResponseEntity<ApiResponse<String>> logoutUser(
            @Parameter(description = "Refresh token from cookie")
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            @Parameter(description = "Authorization header with Bearer token")
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletResponse response);

    @Operation(summary = "Forgot password", description = "Sends a password reset email to the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset email sent successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid email format")
    })
    ResponseEntity<ApiResponse<String>> forgotPassword(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Email verification request", required = true,
                    content = @Content(schema = @Schema(implementation = VerifyEmailRequestDTO.class)))
            @RequestBody VerifyEmailRequestDTO verifyEmailRequestDTO);

    @Operation(summary = "Reset password", description = "Resets user password using a valid reset token.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid password format")
    })
    ResponseEntity<ApiResponse<String>> resetPassword(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Password reset request", required = true,
                    content = @Content(schema = @Schema(implementation = ResetPasswordRequestDTO.class)))
            @RequestBody ResetPasswordRequestDTO resetPasswordRequestDTO);

    @Operation(summary = "Change password", description = "Changes the password for an authenticated user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password changed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid old password or new password format")
    })
    ResponseEntity<ApiResponse<String>> changePassword(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Change password request", required = true,
                    content = @Content(schema = @Schema(implementation = ChangePasswordRequestDTO.class)))
            @RequestBody ChangePasswordRequestDTO changePasswordRequestDTO);

    @Operation(summary = "Renew access token", description = "Generates a new access token using a valid refresh token.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token renewed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Missing or invalid refresh token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Expired refresh token")
    })
    ResponseEntity<ApiResponse<UserLoginResponseDTO>> renewToken(
            @Parameter(description = "Refresh token from cookie", required = true)
            @CookieValue("refreshToken") String refreshToken,
            HttpServletResponse response);

    @Operation(summary = "Send verification email", description = "Sends an email verification link to the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Verification email sent successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid email format")
    })
    ResponseEntity<ApiResponse<String>> sendVerificationEmail(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Email verification request", required = true,
                    content = @Content(schema = @Schema(implementation = VerifyEmailRequestDTO.class)))
            @RequestBody VerifyEmailRequestDTO verifyEmailRequestDTO);

    @Operation(summary = "Check username availability", description = "Check if a username is available for registration")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Username availability checked successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid username format")
    })
    ResponseEntity<ApiResponse<UsernameAvailabilityResponseDTO>> checkUsernameAvailability(
            @Parameter(description = "Username to check") @RequestParam String username
    );
}
