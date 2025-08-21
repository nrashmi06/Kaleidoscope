package com.kaleidoscope.backend.auth.service;

import com.kaleidoscope.backend.auth.dto.request.UserLoginRequestDTO;
import com.kaleidoscope.backend.auth.dto.request.UserRegistrationRequestDTO;
import com.kaleidoscope.backend.auth.dto.response.UserRegistrationResponseDTO;
import com.kaleidoscope.backend.auth.dto.response.UsernameAvailabilityResponseDTO;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Map;

/**
 * Service interface for authentication-related operations
 */
public interface AuthService {

    /**
     * Authenticate user and generate tokens
     *
     * @param loginRequest Login credentials
     * @return Map containing user data and access tokens
     */
    Map<String, Object> loginUser(UserLoginRequestDTO loginRequest);

    /**
     * Register a new user in the system
     *
     * @param registrationRequest User registration data
     * @return Registration response with user details
     */
    UserRegistrationResponseDTO registerUser(UserRegistrationRequestDTO registrationRequest);

    /**
     * Initiate password reset process by sending email with verification code
     *
     * @param email User's email
     */
    void forgotPassword(String email);

    /**
     * Reset user password using verification token
     *
     * @param token Verification token
     * @param newPassword New password
     */
    void resetPassword(String token, String newPassword);

    /**
     * Change user password by providing old and new passwords
     *
     * @param userId User ID
     * @param oldPassword Current password
     * @param newPassword New password
     */
    void changePasswordById(Long userId, String oldPassword, String newPassword);

    /**
     * Clear authentication cookies from response
     *
     * @param response HTTP response
     * @param baseUrl Base URL for domain settings
     */
    void clearCookies(HttpServletResponse response, String baseUrl);

    /**
     * Send email verification to user
     *
     * @param email User's email
     */
    void sendVerificationEmail(String email);


    /**
     * Verify user's email using verification code
     *
     * @param verificationCode Email verification code
     */
    void verifyUser(String verificationCode);
    /**
     * Check if a username is available for registration
     *
     * @param username Username to check
     * @return Response indicating availability status
     */
    UsernameAvailabilityResponseDTO checkUsernameAvailability(String username);
}