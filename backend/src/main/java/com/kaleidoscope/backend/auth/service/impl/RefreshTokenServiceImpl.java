package com.kaleidoscope.backend.auth.service.impl;

import com.kaleidoscope.backend.auth.config.JwtProperties;
import com.kaleidoscope.backend.auth.exception.token.RefreshTokenException;
import com.kaleidoscope.backend.auth.mapper.AuthMapper;
import com.kaleidoscope.backend.auth.mapper.RefreshTokenMapper;
import com.kaleidoscope.backend.auth.model.RefreshToken;
import com.kaleidoscope.backend.auth.repository.RefreshTokenRepository;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.auth.service.RefreshTokenService;
import com.kaleidoscope.backend.shared.config.ApplicationProperties;
import com.kaleidoscope.backend.shared.exception.other.UserNotFoundException;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.users.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@Slf4j
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private static final long REFRESH_TOKEN_VALIDITY_MS = 1_000L * 60 * 60 * 24; // 24 hrs
    private final ApplicationProperties applicationProperties;
    private final UserService userService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final JwtProperties jwtProperties;

    @Autowired
    public RefreshTokenServiceImpl(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository,
            JwtUtils jwtUtils,
            @Lazy UserService userService,
            ApplicationProperties applicationProperties,
            JwtProperties jwtProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.userService = userService;
        this.applicationProperties = applicationProperties;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    @Override
    public RefreshToken createRefreshToken(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }

        RefreshToken refreshToken = refreshTokenRepository.findRefreshTokenByUserId(user.getUserId())
                .map(AuthMapper::updateRefreshToken)  // Use mapper to update existing token
                .orElseGet(() -> AuthMapper.toRefreshToken(user));  // Use mapper to create new token

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public String getEmailFromRefreshToken(String token) {
        log.debug("Attempting to get email from refresh token: {}", token.substring(0, 6) + "...");
        RefreshToken refreshToken = validateRefreshTokenAndGet(token);
        String email = refreshToken.getUser().getEmail();
        log.debug("Successfully retrieved email: {}", email);
        return email;
    }

    @Transactional
    @Override
    public void deleteRefreshToken(String token) {
        log.debug("Attempting to delete refresh token: {}", token.substring(0, 6) + "...");
        try {
            refreshTokenRepository.deleteByToken(token);
            log.info("Successfully deleted refresh token");
        } catch (Exception e) {
            log.error("Error deleting refresh token", e);
            throw e;
        }
    }

    @Override
    public boolean verifyRefreshToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .filter(rt -> rt.getExpiry().isAfter(Instant.now()))
                .isPresent();
    }

    @Transactional
    @Override
    public Map<String, Object> renewToken(String refreshToken) {
        RefreshToken existingToken = validateRefreshTokenAndGet(refreshToken);

        UserDetails userDetails = userService.loadUserByUsername(existingToken.getUser().getEmail());
        Long userId = existingToken.getUser().getUserId();

        String newAccessToken = jwtUtils.generateTokenFromUsername(userDetails, userId);
        String newRefreshToken = createRefreshToken(userDetails.getUsername()).getToken();

        User user = existingToken.getUser();
        userRepository.save(user);

        // Use mapper to create renewal response
        return RefreshTokenMapper.toRenewalResponse(user, newAccessToken, newRefreshToken);
    }

    private RefreshToken validateRefreshTokenAndGet(String token) {
        log.debug("Validating refresh token: {}", token.substring(0, 6) + "...");

        return refreshTokenRepository.findByToken(token)
                .map(rt -> {
                    boolean isValid = rt.getExpiry().isAfter(Instant.now());
                    log.debug("Token valid: {}, Expiry: {}", isValid, rt.getExpiry());
                    if (!isValid) {
                        log.warn("Refresh token has expired: {}", token.substring(0, 6) + "...");
                        throw new RefreshTokenException("Expired refresh token");
                    }
                    return rt;
                })
                .orElseThrow(() -> {
                    log.warn("Refresh token not found: {}", token.substring(0, 6) + "...");
                    return new RefreshTokenException("Invalid refresh token");
                });
    }

    @Override
    public void setSecureRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        log.debug("Setting secure refresh token cookie");

        String baseUrl = applicationProperties.baseUrl();
        boolean isSecure = !baseUrl.contains("localhost");
        String sameSite = isSecure ? "None" : "Lax";

        int maxAgeDays = jwtProperties.cookieMaxAgeDays();
        int maxAge = maxAgeDays * 24 * 60 * 60; // Convert days to seconds

        // Build the Set-Cookie header manually for better control with Nginx proxy
        StringBuilder cookieString = new StringBuilder();
        cookieString.append(String.format("refreshToken=%s", refreshToken));
        cookieString.append("; Path=/"); // Use root path since Nginx handles the context path
        cookieString.append("; HttpOnly");
        cookieString.append(String.format("; Max-Age=%d", maxAge));
        cookieString.append(String.format("; SameSite=%s", sameSite));

        if (isSecure) {
            cookieString.append("; Secure");
            // For production, don't set domain - let browser use the current domain
            // This works better with reverse proxies
            log.debug("Cookie configured for production (Secure=true, SameSite=None)");
        } else {
            log.debug("Cookie configured for development (Secure=false, SameSite=Lax)");
        }

        response.setHeader("Set-Cookie", cookieString.toString());
        log.debug("Refresh token cookie set successfully with path=/ and SameSite={}", sameSite);
    }

    public void clearRefreshTokenCookie(HttpServletResponse response) {
        String baseUrl = applicationProperties.baseUrl();
        boolean isSecure = !baseUrl.contains("localhost");
        String sameSite = isSecure ? "None" : "Lax";

        // Build the Set-Cookie header to clear the cookie
        StringBuilder cookieString = new StringBuilder();
        cookieString.append("refreshToken=");
        cookieString.append("; Path=/");
        cookieString.append("; HttpOnly");
        cookieString.append("; Max-Age=0"); // Expire immediately
        cookieString.append(String.format("; SameSite=%s", sameSite));

        if (isSecure) {
            cookieString.append("; Secure");
        }

        response.setHeader("Set-Cookie", cookieString.toString());
        log.info("Refresh token cookie cleared successfully");
    }
}
