package com.kaleidoscope.backend.auth.service.impl;

import com.kaleidoscope.backend.auth.dto.request.UserLoginRequestDTO;
import com.kaleidoscope.backend.auth.dto.request.UserRegistrationRequestDTO;
import com.kaleidoscope.backend.auth.dto.response.UserLoginResponseDTO;
import com.kaleidoscope.backend.auth.dto.response.UserRegistrationResponseDTO;
import com.kaleidoscope.backend.auth.exception.auth.InvalidUserCredentialsException;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyInUseException;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyVerifiedException;
import com.kaleidoscope.backend.auth.exception.email.InvalidEmailException;
import com.kaleidoscope.backend.auth.model.EmailVerification;
import com.kaleidoscope.backend.auth.repository.EmailVerificationRepository;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.auth.service.AuthService;
import com.kaleidoscope.backend.auth.service.EmailService;
import com.kaleidoscope.backend.auth.service.RefreshTokenService;
import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.shared.exception.Image.ImageStorageException;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.users.enums.Theme;
import com.kaleidoscope.backend.users.enums.Visibility;
import com.kaleidoscope.backend.users.exception.user.InvalidUsernameException;
import com.kaleidoscope.backend.users.exception.user.UserAccountSuspendedException;
import com.kaleidoscope.backend.users.exception.user.UserNotActiveException;
import com.kaleidoscope.backend.users.exception.user.UserNotFoundException;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserPreferences;
import com.kaleidoscope.backend.users.repository.UserPreferencesRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService, UserDetailsService {

    @Value("${spring.app.defaults.cover-photo-url}")
    private String defaultCoverPhotoUrl;

    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;
    private final UserMapper userMapper;
    private final ImageStorageService imageStorageService;

    public AuthServiceImpl(
            JwtUtils jwtUtils,
            @Lazy AuthenticationManager authenticationManager,
            UserRepository userRepository,
            UserPreferencesRepository userPreferencesRepository,
            RefreshTokenService refreshTokenService,
            PasswordEncoder passwordEncoder,
            EmailVerificationRepository emailVerificationRepository,
            EmailService emailService,
            UserMapper userMapper,
            ImageStorageService imageStorageService
    ) {
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.userPreferencesRepository = userPreferencesRepository;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationRepository = emailVerificationRepository;
        this.emailService = emailService;
        this.userMapper = userMapper;
        this.imageStorageService = imageStorageService;
    }

    @Override
    @Transactional
    public Map<String, Object> loginUser(UserLoginRequestDTO loginRequest) {
        log.debug("Processing login for user: {}", loginRequest.getEmail());

        // Check if user exists
        User user = userRepository.findByEmail(loginRequest.getEmail());
        if (user == null) {
            log.warn("Login failed: invalid email {}", loginRequest.getEmail());
            throw new UsernameNotFoundException("Invalid email");
        }

        // Authenticate user
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );
        } catch (AuthenticationException e) {
            log.warn("Login failed: invalid password for {}", loginRequest.getEmail());
            throw new InvalidUserCredentialsException("Invalid password");
        }

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            log.error("User is not active: {}", user.getEmail());
            throw new UserNotActiveException("User is not active");
        }
        user.setLastSeen(LocalDateTime.now());

        userRepository.save(user);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = jwtUtils.generateTokenFromUsername(userDetails, user.getUserId());
        String refreshToken = refreshTokenService.createRefreshToken(user.getEmail()).getToken();
        UserLoginResponseDTO userDTO = UserMapper.toUserLoginResponseDTO(user);

        Map<String, Object> response = new HashMap<>();
        response.put("user", userDTO);
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken);

        log.info("Login successful for user: {}", user.getEmail());
        return response;
    }

    private boolean isValidEmail(String email) {
        // Regular expression for validating an email address
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
        return email != null && email.matches(emailRegex);
    }

    private boolean isValidUsername(String username) {
        return username != null &&
                !username.trim().isEmpty() &&
                username.matches("^[a-zA-Z0-9 ._-]{3,}$");
    }

    @Override
    @Transactional
    public UserRegistrationResponseDTO registerUser(UserRegistrationRequestDTO userRegistrationDTO) {
        // Validate email format
        if (!isValidEmail(userRegistrationDTO.getEmail())) {
            throw new InvalidEmailException("Invalid email format: " + userRegistrationDTO.getEmail());
        }

        // Check if email already exists
        if (userRepository.existsByEmail(userRegistrationDTO.getEmail())) {
            throw new EmailAlreadyInUseException("Email is already in use: " + userRegistrationDTO.getEmail());
        }

        // Validate username
        String trimmedUserName = userRegistrationDTO.getUsername().replaceAll("\\s+", "");
        if (!isValidUsername(trimmedUserName)) {
            throw new InvalidUsernameException("Invalid username: " + trimmedUserName + ". Please try another.");
        }

        try {
            // Handle profile picture upload
            String profilePictureUrl = null;
            if (userRegistrationDTO.getProfilePicture() != null && !userRegistrationDTO.getProfilePicture().isEmpty()) {
                try {
                    profilePictureUrl = imageStorageService.uploadImage(userRegistrationDTO.getProfilePicture()).get();
                } catch (Exception e) {
                    log.error("Failed to upload profile picture", e);
                    throw new ImageStorageException("Failed to upload profile picture");
                }
            }

            // Use default cover photo URL from application properties
            String coverPhotoUrl = defaultCoverPhotoUrl;

            // Create and save the user
            User user = userMapper.toEntity(
                    userRegistrationDTO,
                    passwordEncoder.encode(userRegistrationDTO.getPassword()),
                    profilePictureUrl
            );
            user.setUsername(trimmedUserName);
            user.setCoverPhotoUrl(coverPhotoUrl);

            userRepository.save(user);

            // Create default user preferences for the new user
            UserPreferences userPreferences = UserPreferences.builder()
                    .user(user)
                    .theme(Theme.SYSTEM)
                    .language("en-US")
                    .profileVisibility(Visibility.PUBLIC)
                    .allowMessages(Visibility.FRIENDS_ONLY)
                    .allowTagging(Visibility.PUBLIC)
                    .viewActivity(Visibility.FRIENDS_ONLY)
                    .showEmail(false)
                    .showPhone(false)
                    .showOnlineStatus(true)
                    .searchDiscoverable(true)
                    .build();

            userPreferencesRepository.save(userPreferences);
            log.info("Created default user preferences for user ID: {}", user.getUserId());

            // Send verification email for new registration
            sendVerificationEmail(user.getEmail());

            return UserMapper.toRegistrationResponseDTO(user);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An error occurred while registering the user", e);
        }
    }


    @Override
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }

        // Generate a new 6-digit numeric token
        String token = UUID.randomUUID().toString().replaceAll("[^0-9]", "").substring(0, 6);

        // Check if an entry already exists for this email
        Optional<EmailVerification> existingVerification = emailVerificationRepository.findByEmail(email);
        EmailVerification emailVerification;

        if (existingVerification.isPresent()) {
            // Update existing verification record
            emailVerification = existingVerification.get();
            emailVerification.setVerificationCode(token);
            emailVerification.setStatus("pending");
            emailVerification.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        } else {
            // Create new verification record
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

        // Create cookie with security attributes and max-age=0
        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(isSecure);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0); // Expire immediately

        // Set domain for non-localhost environments
        if (!baseUrl.contains("localhost")) {
            String domain = baseUrl.replaceAll("https?://", "")
                    .replaceAll("/.*$", "")
                    .split(":")[0]
                    .trim();
            refreshTokenCookie.setDomain(domain);
        }

        // Add cookie to response
        response.addCookie(refreshTokenCookie);

        // Set explicit cookie header for additional browser compatibility
        String cookieString = String.format(
                "refreshToken=; Path=/; HttpOnly; Max-Age=0; SameSite=%s%s",
                sameSite,
                isSecure ? "; Secure" : ""
        );

        if (!baseUrl.contains("localhost")) {
            cookieString += "; Domain=" + refreshTokenCookie.getDomain();
        }

        response.setHeader("Set-Cookie", cookieString);

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
}

