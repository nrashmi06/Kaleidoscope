package com.kaleidoscope.backend.auth.service;

import com.kaleidoscope.backend.auth.dto.request.UserLoginRequestDTO;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

public interface AuthService {
    Map<String, Object> loginUser(UserLoginRequestDTO loginRequest);
    void forgotPassword(String email);
    void resetPassword(String token, String newPassword);
    void clearCookies(HttpServletResponse response, String baseUrl);
    void verifyUser(String verificationCode);
    void sendVerificationEmail(String email);
    void resendVerificationEmail(String email);
    void changePasswordById(Long userId, String oldPassword, String newPassword);
    UserDetails loadUserByUsername(String username);
}