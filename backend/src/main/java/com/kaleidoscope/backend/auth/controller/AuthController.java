package com.kaleidoscope.backend.auth.controller;

import com.kaleidoscope.backend.auth.dto.request.*;
import com.kaleidoscope.backend.auth.dto.response.*;
import com.kaleidoscope.backend.auth.exception.token.MissingRequestCookieException;
import com.kaleidoscope.backend.auth.service.AuthService;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.auth.routes.AuthRoutes;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.users.service.UserService;
import com.kaleidoscope.backend.auth.service.impl.RefreshTokenServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@Slf4j
@Tag(name = "Authentication", description = "APIs for user authentication and account management")
public class AuthController {

    private final String baseUrl;
    private final UserService userService;
    private final RefreshTokenServiceImpl refreshTokenService;
    private final JwtUtils jwtUtils;
    private final AuthService authService;

    public AuthController(UserService userService,
                          RefreshTokenServiceImpl refreshTokenService,
                          @Value("${spring.app.base-url}") String baseUrl, JwtUtils jwtUtils, AuthService authService) {
        this.userService = userService;
        this.refreshTokenService = refreshTokenService;
        this.baseUrl = baseUrl;
        this.jwtUtils = jwtUtils;
        this.authService = authService;
    }

    @Operation(summary = "Register a new user", description = "Creates a new user account with optional profile picture.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User registered successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input or user already exists"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    @PostMapping(value = AuthRoutes.REGISTER, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserRegistrationResponseDTO>> registerUser(
            @Parameter(description = "Profile picture file (optional)")
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "User registration data", required = true,
                    content = @Content(schema = @Schema(implementation = UserRegistrationRequestDTO.class)))
            @RequestPart("userData") UserRegistrationRequestDTO userRegistrationDTO) {

        userRegistrationDTO.setProfilePicture(profilePicture);
        UserRegistrationResponseDTO userDTO = authService.registerUser(userRegistrationDTO);

        ApiResponse<UserRegistrationResponseDTO> response = ApiResponse.success(
                userDTO,
                "User registered successfully",
                AuthRoutes.REGISTER
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Login user", description = "Authenticates a user and returns access token with refresh token cookie.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input")
    })
    @PostMapping(AuthRoutes.LOGIN)
    public ResponseEntity<ApiResponse<UserLoginResponseDTO>> authenticateUser(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "User login credentials", required = true,
                    content = @Content(schema = @Schema(implementation = UserLoginRequestDTO.class)))
            @RequestBody UserLoginRequestDTO loginRequest,
            HttpServletResponse response) {

        log.debug("Processing login request for email: {}", loginRequest.getEmail());
        Map<String, Object> loginResponse = authService.loginUser(loginRequest);

        String accessToken = (String) loginResponse.get("accessToken");
        String refreshToken = (String) loginResponse.get("refreshToken");
        UserLoginResponseDTO userDTO = (UserLoginResponseDTO) loginResponse.get("user");

        refreshTokenService.setSecureRefreshTokenCookie(response, refreshToken);
        String bearerToken = "Bearer " + accessToken;

        ApiResponse<UserLoginResponseDTO> apiResponse = ApiResponse.success(
                userDTO,
                "Login successful",
                AuthRoutes.LOGIN
        );

        log.info("User successfully authenticated: {}", userDTO.getEmail());

        return ResponseEntity.ok()
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .body(apiResponse);
    }

    @Operation(summary = "Logout user", description = "Logs out the user by invalidating refresh token and clearing security context.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logout successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class)))
    })
    @PostMapping(AuthRoutes.LOGOUT)
    public ResponseEntity<ApiResponse<String>> logoutUser(
            @Parameter(description = "Refresh token from cookie")
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            @Parameter(description = "Authorization header with Bearer token")
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletResponse response) {

        log.info("Logout request received");

        if (refreshToken != null && !refreshToken.isEmpty()) {
            String email = refreshTokenService.getEmailFromRefreshToken(refreshToken);
            refreshTokenService.deleteRefreshToken(refreshToken);
            log.info("Refresh token deleted for user: {}", email);
        }

        SecurityContextHolder.clearContext();
        authService.clearCookies(response, baseUrl);

        ApiResponse<String> apiResponse = ApiResponse.success(
                "User logged out successfully",
                "Logout successful",
                AuthRoutes.LOGOUT
        );

        return ResponseEntity.ok(apiResponse);
    }

    @Operation(summary = "Forgot password", description = "Sends a password reset email to the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset email sent successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid email format")
    })
    @PostMapping(AuthRoutes.FORGOT_PASSWORD)
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Email verification request", required = true,
                    content = @Content(schema = @Schema(implementation = VerifyEmailRequestDTO.class)))
            @RequestBody VerifyEmailRequestDTO verifyEmailRequestDTO) {
        authService.forgotPassword(verifyEmailRequestDTO.getEmail());

        ApiResponse<String> response = ApiResponse.success(
                "Password reset email sent successfully",
                "Email sent",
                AuthRoutes.FORGOT_PASSWORD
        );

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Reset password", description = "Resets user password using a valid reset token.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid password format")
    })
    @PostMapping(AuthRoutes.RESET_PASSWORD)
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Password reset request", required = true,
                    content = @Content(schema = @Schema(implementation = ResetPasswordRequestDTO.class)))
            @RequestBody ResetPasswordRequestDTO resetPasswordRequestDTO) {
        authService.resetPassword(resetPasswordRequestDTO.getToken(), resetPasswordRequestDTO.getNewPassword());

        ApiResponse<String> response = ApiResponse.success(
                "Password has been reset successfully",
                "Password reset",
                AuthRoutes.RESET_PASSWORD
        );

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Change password", description = "Changes the password for an authenticated user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password changed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid old password or new password format")
    })
    @PutMapping(AuthRoutes.CHANGE_PASSWORD)
    public ResponseEntity<ApiResponse<String>> changePassword(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Change password request", required = true,
                    content = @Content(schema = @Schema(implementation = ChangePasswordRequestDTO.class)))
            @RequestBody ChangePasswordRequestDTO changePasswordRequestDTO) {
        Long userId = Long.valueOf(jwtUtils.getUserIdFromContext());
        authService.changePasswordById(userId, changePasswordRequestDTO.getOldPassword(), changePasswordRequestDTO.getNewPassword());

        ApiResponse<String> response = ApiResponse.success(
                "Password changed successfully",
                "Password updated",
                AuthRoutes.CHANGE_PASSWORD
        );

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Renew access token", description = "Generates a new access token using a valid refresh token.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token renewed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Missing or invalid refresh token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Expired refresh token")
    })
    @PostMapping(AuthRoutes.RENEW_TOKEN)
    public ResponseEntity<ApiResponse<UserLoginResponseDTO>> renewToken(
            @Parameter(description = "Refresh token from cookie", required = true)
            @CookieValue("refreshToken") String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null) {
            throw new MissingRequestCookieException("Required cookie 'refreshToken' is not present");
        }

        Map<String, Object> renewResponse = refreshTokenService.renewToken(refreshToken);

        String newAccessToken = (String) renewResponse.get("accessToken");
        String newRefreshToken = (String) renewResponse.get("refreshToken");
        UserLoginResponseDTO userDTO = (UserLoginResponseDTO) renewResponse.get("user");

        refreshTokenService.setSecureRefreshTokenCookie(response, newRefreshToken);
        String bearerToken = "Bearer " + newAccessToken;

        ApiResponse<UserLoginResponseDTO> apiResponse = ApiResponse.success(
                userDTO,
                "Token renewed successfully",
                AuthRoutes.RENEW_TOKEN
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .body(apiResponse);
    }

    @Operation(summary = "Send verification email", description = "Sends an email verification link to the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Verification email sent successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid email format")
    })
    @PostMapping(AuthRoutes.VERIFY_EMAIL)
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<String>> sendVerificationEmail(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Email verification request", required = true,
                    content = @Content(schema = @Schema(implementation = VerifyEmailRequestDTO.class)))
            @RequestBody VerifyEmailRequestDTO verifyEmailRequestDTO) {
        authService.sendVerificationEmail(verifyEmailRequestDTO.getEmail());

        ApiResponse<String> response = ApiResponse.success(
                "Verification email sent successfully",
                "Email sent",
                AuthRoutes.VERIFY_EMAIL
        );

        return ResponseEntity.ok(response);
    }
}