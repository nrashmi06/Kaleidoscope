package com.kaleidoscope.backend.auth.service.impl;

import com.kaleidoscope.backend.auth.dto.request.UserLoginRequestDTO;
import com.kaleidoscope.backend.auth.dto.request.UserRegistrationRequestDTO;
import com.kaleidoscope.backend.auth.dto.response.SseTicketResponseDTO;
import com.kaleidoscope.backend.auth.dto.response.UserLoginResponseDTO;
import com.kaleidoscope.backend.auth.dto.response.UserRegistrationResponseDTO;
import com.kaleidoscope.backend.auth.dto.response.UsernameAvailabilityResponseDTO;
import com.kaleidoscope.backend.auth.exception.auth.UnauthorizedAccessException;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyVerifiedException;
import com.kaleidoscope.backend.auth.model.EmailVerification;
import com.kaleidoscope.backend.auth.repository.EmailVerificationRepository;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.auth.service.AuthService;
import com.kaleidoscope.backend.auth.service.EmailService;
import com.kaleidoscope.backend.auth.service.RefreshTokenService;
import com.kaleidoscope.backend.auth.service.UserRegistrationService;
import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.shared.exception.other.UserNotFoundException;
import com.kaleidoscope.backend.users.exception.user.UserAccountSuspendedException;
import com.kaleidoscope.backend.users.exception.user.UserNotActiveException;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService, UserDetailsService {

    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;
    private final UserRegistrationService userRegistrationService;
    private final StringRedisTemplate stringRedisTemplate;

    public AuthServiceImpl(
            JwtUtils jwtUtils,
            @Lazy AuthenticationManager authenticationManager,
            UserRepository userRepository,
            RefreshTokenService refreshTokenService,
            PasswordEncoder passwordEncoder,
            EmailVerificationRepository emailVerificationRepository,
            EmailService emailService,
            UserRegistrationService userRegistrationService,
            StringRedisTemplate stringRedisTemplate
    ) {
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationRepository = emailVerificationRepository;
        this.emailService = emailService;
        this.userRegistrationService = userRegistrationService;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    @Transactional
    public Map<String, Object> loginUser(UserLoginRequestDTO loginRequest) {
        log.debug("Processing login for user: {}", loginRequest.email());

        // 1. Authenticate user. This will throw an exception if credentials are bad
        // or the user does not exist, which is handled by your AuthExceptionHandler.
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.email(),
                        loginRequest.password()
                )
        );

        // 2. Get the full User object after successful authentication.
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername());
        if (user == null) {
            // This is a safety check, but should theoretically never be reached
            // if authentication succeeded.
            throw new UsernameNotFoundException("User not found after authentication");
        }


        // 3. Check account status.
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            log.error("User is not active: {}", user.getEmail());
            throw new UserNotActiveException("User is not active. Please verify your email.");
        }

        // 4. Update last seen timestamp and save.
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        // 5. Generate tokens and prepare the response.
        String accessToken = jwtUtils.generateTokenFromUsername(userDetails, user.getUserId());
        String refreshToken = refreshTokenService.createRefreshToken(user.getEmail()).getToken();
        UserLoginResponseDTO userDTO = new UserLoginResponseDTO(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole().name(),
                user.getProfilePictureUrl()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("user", userDTO);
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken);

        log.info("Login successful for user: {}", user.getEmail());
        return response;
    }

    @Override
    @Transactional
    public UserRegistrationResponseDTO registerUser(UserRegistrationRequestDTO userRegistrationDTO) {
        log.info("Delegating user registration to UserRegistrationService for email: {}", userRegistrationDTO.getEmail());
        return userRegistrationService.registerUser(userRegistrationDTO);
    }

    @Override
    public void forgotPassword(String email) {
        // Let global exception handler manage UserNotFoundException
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }

        // Generate a new 6-digit numeric token
        String token = UUID.randomUUID().toString().replaceAll("[^0-9]", "").substring(0, 6);

        // Create or update email verification record
        Optional<EmailVerification> existingVerification = emailVerificationRepository.findByEmail(email);
        EmailVerification emailVerification;

        if (existingVerification.isPresent()) {
            emailVerification = existingVerification.get();
            emailVerification.setVerificationCode(token);
            emailVerification.setStatus("pending");
            emailVerification.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        } else {
            emailVerification = new EmailVerification();
            emailVerification.setUserId(user.getUserId());
            emailVerification.setVerificationCode(token);
            emailVerification.setEmail(email);
            emailVerification.setStatus("pending");
            emailVerification.setExpiryTime(LocalDateTime.now().plusMinutes(5));
            emailVerification.setCreatedAt(LocalDateTime.now());
        }

        emailVerificationRepository.save(emailVerification);
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        EmailVerification emailVerification = emailVerificationRepository.findByVerificationCode(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification code"));

        if (emailVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Verification code has expired");
        }

        User user = userRepository.findById(emailVerification.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        emailVerification.setStatus("verified");
        emailVerificationRepository.save(emailVerification);
    }

    @Override
    public void changePasswordById(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Override
    public void clearCookies(HttpServletResponse response, String baseUrl) {
        log.info("Clearing refresh token cookie");

        boolean isSecure = !baseUrl.contains("localhost");
        String sameSite = isSecure ? "None" : "Lax"; // Use Lax for localhost

        // Build the Set-Cookie header to clear the cookie
        StringBuilder cookieString = new StringBuilder();
        cookieString.append("refreshToken=");
        cookieString.append("; Path=/"); // Root path to match cookie setting
        cookieString.append("; HttpOnly");
        cookieString.append("; Max-Age=0"); // Expire immediately
        cookieString.append(String.format("; SameSite=%s", sameSite));

        if (isSecure) {
            cookieString.append("; Secure");
        }

        response.setHeader("Set-Cookie", cookieString.toString());

        log.info("Cookie cleared - Path: /, MaxAge: 0, Secure: {}, SameSite: {}",
                isSecure, sameSite);
    }

    @Override
    public void verifyUser(String verificationCode) {
        EmailVerification emailVerification = emailVerificationRepository.findByVerificationCode(verificationCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification code"));

        if (emailVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Verification code has expired");
        }

        emailVerification.setStatus("verified");
        emailVerificationRepository.save(emailVerification);

        User user = userRepository.findById(emailVerification.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if(user.getAccountStatus().equals(AccountStatus.SUSPENDED)){
            throw new UserAccountSuspendedException("User Account Suspended");
        }
        user.setIsVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);
    }

    @Override
    public void sendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }
        if (user.getAccountStatus().equals(AccountStatus.ACTIVE)) {
            throw new EmailAlreadyVerifiedException("User is already verified");
        }

        String token = UUID.randomUUID().toString().substring(0, 10);
        Optional<EmailVerification> existing = emailVerificationRepository.findByEmail(email);
        EmailVerification emailVerification;

        if (existing.isPresent()) {
            // Update existing row with new code and expiry
            emailVerification = existing.get();
            emailVerification.setVerificationCode(token);
            emailVerification.setExpiryTime(LocalDateTime.now().plusMinutes(5));
            emailVerification.setStatus("pending");
            emailVerification.setCreatedAt(LocalDateTime.now());
        } else {
            // Create new row
            emailVerification = new EmailVerification();
            emailVerification.setUserId(user.getUserId());
            emailVerification.setEmail(email);
            emailVerification.setVerificationCode(token);
            emailVerification.setExpiryTime(LocalDateTime.now().plusHours(24));
            emailVerification.setStatus("pending");
            emailVerification.setCreatedAt(LocalDateTime.now());
        }
        emailVerificationRepository.save(emailVerification);

        emailService.sendVerificationEmail(user.getEmail(), token);
    }


    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                createAuthorities(user.getRole())
        );
    }

    private static List<GrantedAuthority> createAuthorities(Role role) {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public UsernameAvailabilityResponseDTO checkUsernameAvailability(String username) {
        if (username == null || username.trim().isEmpty()) {
            return new UsernameAvailabilityResponseDTO(false, "");
        }

        String trimmedUsername = username.replaceAll("\\s+", "");

        // Basic validation only - detailed validation is in UserRegistrationService
        if (trimmedUsername.length() < 3 || !trimmedUsername.matches("^[a-zA-Z0-9 ._-]+$")) {
            return new UsernameAvailabilityResponseDTO(false, trimmedUsername);
        }

        boolean isAvailable = !userRepository.existsByUsername(trimmedUsername);

        return new UsernameAvailabilityResponseDTO(isAvailable, trimmedUsername);
    }

    @Override
    @Transactional
    public SseTicketResponseDTO generateSseTicket() {
        Long userId = jwtUtils.getUserIdFromContext();
        if (userId == null) {
            log.warn("Attempt to generate SSE ticket with no authenticated user context");
            throw new UnauthorizedAccessException("User not authenticated");
        }

        String ticket = UUID.randomUUID().toString();
        String redisKey = "sse-ticket:" + ticket;

        log.debug("Attempting to generate SSE ticket for userId: {} with key: {}", userId, redisKey);

        try {
            // Store the ticket in Redis, mapping it to the userId.
            // Set a 30-second expiry. This is more than enough time for the client
            // to receive the ticket and immediately use it to connect.
            stringRedisTemplate.opsForValue().set(redisKey, userId.toString(), 30, TimeUnit.SECONDS);

            log.info("✓ SSE ticket generated and stored successfully | userId: {} | redisKey: {} | TTL: 30s | ticket: {}...",
                    userId, redisKey, ticket.substring(0, Math.min(8, ticket.length())));
            log.debug("Full ticket details | userId: {} | ticket: {} | expiresIn: 30 seconds", userId, ticket);

            return new SseTicketResponseDTO(ticket);
        } catch (Exception e) {
            log.error("✗ Failed to store SSE ticket in Redis | userId: {} | redisKey: {} | error: {}",
                    userId, redisKey, e.getMessage(), e);
            throw new RuntimeException("Could not generate SSE ticket due to a server error", e);
        }
    }
}
