package com.kaleidoscope.backend.auth.mapper;

import com.kaleidoscope.backend.auth.model.EmailVerification;
import com.kaleidoscope.backend.auth.model.RefreshToken;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Mapper for authentication-related entities
 * Migrated from UserRegistrationServiceImpl and RefreshTokenServiceImpl
 */
@Component
public class AuthMapper {

    private static final long REFRESH_TOKEN_VALIDITY_MS = 1_000L * 60 * 60 * 24; // 24 hrs

    /**
     * Create EmailVerification entity
     * Migrated from UserRegistrationServiceImpl.sendVerificationEmailSafely
     */
    public static EmailVerification toEmailVerification(Long userId, String email, String token) {
        EmailVerification emailVerification = new EmailVerification();
        emailVerification.setUserId(userId);
        emailVerification.setEmail(email);
        emailVerification.setVerificationCode(token);
        emailVerification.setExpiryTime(LocalDateTime.now().plusHours(24));
        emailVerification.setStatus("pending");
        emailVerification.setCreatedAt(LocalDateTime.now());
        return emailVerification;
    }

    /**
     * Create new RefreshToken entity
     * Migrated from RefreshTokenServiceImpl.createNewRefreshToken
     */
    public static RefreshToken toRefreshToken(User user) {
        return RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .expiry(Instant.now().plusMillis(REFRESH_TOKEN_VALIDITY_MS))
                .user(user)
                .build();
    }

    /**
     * Update existing RefreshToken with new token and expiry
     * Migrated from RefreshTokenServiceImpl.createRefreshToken
     */
    public static RefreshToken updateRefreshToken(RefreshToken refreshToken) {
        refreshToken.setExpiry(Instant.now().plusMillis(REFRESH_TOKEN_VALIDITY_MS));
        refreshToken.setToken(UUID.randomUUID().toString());
        return refreshToken;
    }
}
