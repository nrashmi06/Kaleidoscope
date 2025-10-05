package com.kaleidoscope.backend.auth.controller;

import com.kaleidoscope.backend.auth.controller.api.AuthApi;
import com.kaleidoscope.backend.auth.dto.request.*;
import com.kaleidoscope.backend.auth.dto.response.*;
import com.kaleidoscope.backend.auth.exception.token.MissingRequestCookieException;
import com.kaleidoscope.backend.auth.service.AuthService;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.auth.routes.AuthRoutes;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.users.service.UserService;
import com.kaleidoscope.backend.auth.service.impl.RefreshTokenServiceImpl;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import com.kaleidoscope.backend.auth.dto.response.UsernameAvailabilityResponseDTO;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@Slf4j
public class AuthController implements AuthApi {

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

    @Override
    @PostMapping(value = AuthRoutes.REGISTER, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AppResponse<UserRegistrationResponseDTO>> registerUser(
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture,
            @RequestPart("userData") UserRegistrationRequestDTO userRegistrationDTO) {

        userRegistrationDTO.setProfilePicture(profilePicture);
        UserRegistrationResponseDTO userDTO = authService.registerUser(userRegistrationDTO);

        AppResponse<UserRegistrationResponseDTO> response = AppResponse.success(
                userDTO,
                "User registered successfully",
                AuthRoutes.REGISTER
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Override
    @PostMapping(AuthRoutes.LOGIN)
    public ResponseEntity<AppResponse<UserLoginResponseDTO>> authenticateUser(
            @RequestBody UserLoginRequestDTO loginRequest,
            HttpServletResponse response) {

        log.debug("Processing login request for email: {}", loginRequest.getEmail());
        Map<String, Object> loginResponse = authService.loginUser(loginRequest);

        String accessToken = (String) loginResponse.get("accessToken");
        String refreshToken = (String) loginResponse.get("refreshToken");
        UserLoginResponseDTO userDTO = (UserLoginResponseDTO) loginResponse.get("user");

        refreshTokenService.setSecureRefreshTokenCookie(response, refreshToken);
        String bearerToken = "Bearer " + accessToken;

        AppResponse<UserLoginResponseDTO> appResponse = AppResponse.success(
                userDTO,
                "Login successful",
                AuthRoutes.LOGIN
        );

        log.info("User successfully authenticated: {}", userDTO.getEmail());

        return ResponseEntity.ok()
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .body(appResponse);
    }

    @Override
    @PostMapping(AuthRoutes.LOGOUT)
    public ResponseEntity<AppResponse<String>> logoutUser(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
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

        AppResponse<String> appResponse = AppResponse.success(
                "User logged out successfully",
                "Logout successful",
                AuthRoutes.LOGOUT
        );

        return ResponseEntity.ok(appResponse);
    }

    @Override
    @PostMapping(AuthRoutes.FORGOT_PASSWORD)
    public ResponseEntity<AppResponse<String>> forgotPassword(
            @RequestBody VerifyEmailRequestDTO verifyEmailRequestDTO) {
        authService.forgotPassword(verifyEmailRequestDTO.getEmail());

        AppResponse<String> response = AppResponse.success(
                "Password reset email sent successfully",
                "Email sent",
                AuthRoutes.FORGOT_PASSWORD
        );

        return ResponseEntity.ok(response);
    }

    @Override
    @PostMapping(AuthRoutes.RESET_PASSWORD)
    public ResponseEntity<AppResponse<String>> resetPassword(
            @RequestBody ResetPasswordRequestDTO resetPasswordRequestDTO) {
        authService.resetPassword(resetPasswordRequestDTO.getToken(), resetPasswordRequestDTO.getNewPassword());

        AppResponse<String> response = AppResponse.success(
                "Password has been reset successfully",
                "Password reset",
                AuthRoutes.RESET_PASSWORD
        );

        return ResponseEntity.ok(response);
    }

    @Override
    @PutMapping(AuthRoutes.CHANGE_PASSWORD)
    public ResponseEntity<AppResponse<String>> changePassword(
            @RequestBody ChangePasswordRequestDTO changePasswordRequestDTO) {
        Long userId = Long.valueOf(jwtUtils.getUserIdFromContext());
        authService.changePasswordById(userId, changePasswordRequestDTO.getOldPassword(), changePasswordRequestDTO.getNewPassword());

        AppResponse<String> response = AppResponse.success(
                "Password changed successfully",
                "Password updated",
                AuthRoutes.CHANGE_PASSWORD
        );

        return ResponseEntity.ok(response);
    }

    @Override
    @PostMapping(AuthRoutes.RENEW_TOKEN)
    public ResponseEntity<AppResponse<UserLoginResponseDTO>> renewToken(
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

        AppResponse<UserLoginResponseDTO> appResponse = AppResponse.success(
                userDTO,
                "Token renewed successfully",
                AuthRoutes.RENEW_TOKEN
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .body(appResponse);
    }

    @Override
    @PostMapping(AuthRoutes.VERIFY_EMAIL)
    @PreAuthorize("permitAll()")
    public ResponseEntity<AppResponse<String>> sendVerificationEmail(
            @RequestBody VerifyEmailRequestDTO verifyEmailRequestDTO) {
        authService.sendVerificationEmail(verifyEmailRequestDTO.getEmail());

        AppResponse<String> response = AppResponse.success(
                "Verification email sent successfully",
                "Email sent",
                AuthRoutes.VERIFY_EMAIL
        );

        return ResponseEntity.ok(response);
    }

    @Override
    @GetMapping(AuthRoutes.CHECK_USERNAME_AVAILABILITY)
    public ResponseEntity<AppResponse<UsernameAvailabilityResponseDTO>> checkUsernameAvailability(
            @RequestParam String username) {

        UsernameAvailabilityResponseDTO availabilityResponse = authService.checkUsernameAvailability(username);

        String message = availabilityResponse.isAvailable()
                ? "Username is available"
                : "Username is already taken";

        AppResponse<UsernameAvailabilityResponseDTO> response = AppResponse.success(
                availabilityResponse,
                message,
                AuthRoutes.CHECK_USERNAME_AVAILABILITY
        );

        return ResponseEntity.ok(response);
    }
}

