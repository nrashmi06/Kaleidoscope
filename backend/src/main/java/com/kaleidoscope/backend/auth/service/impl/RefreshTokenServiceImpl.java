package com.kaleidoscope.backend.auth.service.impl;

import com.kaleidoscope.backend.auth.config.JwtProperties;
import com.kaleidoscope.backend.auth.dto.response.UserLoginResponseDTO;
import com.kaleidoscope.backend.auth.exception.token.RefreshTokenException;
import com.kaleidoscope.backend.auth.exception.user.UserNotFoundException;
import com.kaleidoscope.backend.auth.mapper.UserMapper;
import com.kaleidoscope.backend.auth.model.RefreshToken;
import com.kaleidoscope.backend.auth.model.User;
import com.kaleidoscope.backend.auth.repository.RefreshTokenRepository;
import com.kaleidoscope.backend.auth.repository.UserRepository;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.auth.service.RefreshTokenService;
import com.kaleidoscope.backend.auth.service.UserService;
import com.kaleidoscope.backend.shared.config.ApplicationProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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
                .orElseGet(() -> createNewRefreshToken(user));

        refreshToken.setExpiry(Instant.now().plusMillis(REFRESH_TOKEN_VALIDITY_MS));
        refreshToken.setToken(UUID.randomUUID().toString());
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

        UserLoginResponseDTO responseDTO = UserMapper.toUserLoginResponseDTO(user);

        Map<String, Object> response = new HashMap<>();
        response.put("user", responseDTO);
        response.put("accessToken", newAccessToken);
        response.put("refreshToken", newRefreshToken);

        return response;
    }

    private RefreshToken createNewRefreshToken(User user) {
        return RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .expiry(Instant.now().plusMillis(REFRESH_TOKEN_VALIDITY_MS))
                .user(user)
                .build();
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

    public void setSecureRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        log.debug("Setting secure refresh token cookie");

        String baseUrl = applicationProperties.getBaseUrl();
        boolean isSecure = !baseUrl.contains("localhost");
        String sameSite = isSecure ? "None" : "Strict";

        int maxAgeDays = jwtProperties.getCookieMaxAgeDays();
        int maxAge = maxAgeDays * 24 * 60 * 60; // Convert days to seconds

        Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(isSecure);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(maxAge);

        // Set domain for non-localhost environments
        if (!baseUrl.contains("localhost")) {
            String domain = baseUrl.replaceAll("https?://", "")
                    .replaceAll("/.*$", "")
                    .split(":")[0]
                    .trim();
            refreshTokenCookie.setDomain(domain);
        }

        response.addCookie(refreshTokenCookie);

        StringBuilder cookieString = new StringBuilder();
        cookieString.append(String.format("refreshToken=%s", refreshToken));
        cookieString.append("; Path=/");
        cookieString.append("; HttpOnly");
        cookieString.append(String.format("; Max-Age=%d", maxAge));
        cookieString.append(String.format("; SameSite=%s", sameSite));

        if (isSecure) {
            cookieString.append("; Secure");
        }

        if (!baseUrl.contains("localhost")) {
            cookieString.append(String.format("; Domain=%s", refreshTokenCookie.getDomain()));
        }

        response.setHeader("Set-Cookie", cookieString.toString());

        log.debug("Cookie settings - Path: /, MaxAge: {}, Secure: {}, SameSite: {}",
                maxAge, isSecure, sameSite);
    }
}