package com.kaleidoscope.backend.users.service.impl;
import com.kaleidoscope.backend.auth.dto.request.UserLoginRequestDTO;
import com.kaleidoscope.backend.auth.dto.request.UserRegistrationRequestDTO;
import com.kaleidoscope.backend.auth.dto.response.UserLoginResponseDTO;
import com.kaleidoscope.backend.auth.dto.response.UserRegistrationResponseDTO;
import com.kaleidoscope.backend.auth.exception.auth.InvalidUserCredentialsException;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyInUseException;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyVerifiedException;
import com.kaleidoscope.backend.auth.exception.email.InvalidEmailException;
import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.shared.exception.Image.ImageStorageException;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileRequestDTO;
import com.kaleidoscope.backend.users.dto.response.UpdateUserProfileResponseDTO;
import com.kaleidoscope.backend.users.exception.user.*;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.auth.model.EmailVerification;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.auth.repository.EmailVerificationRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.auth.service.EmailService;
import com.kaleidoscope.backend.auth.service.RefreshTokenService;
import com.kaleidoscope.backend.users.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class UserServiceImpl implements UserService, UserDetailsService {

    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;
    private final UserMapper userMapper;
    private final ImageStorageService imageStorageService;

    public UserServiceImpl(JwtUtils jwtUtils,
                           @Lazy AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           RefreshTokenService refreshTokenService,
                           PasswordEncoder passwordEncoder,
                           EmailVerificationRepository emailVerificationRepository,
                           EmailService emailService,
                           UserMapper userMapper,
                           ImageStorageService imageStorageService) {
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationRepository = emailVerificationRepository;
        this.emailService = emailService;
        this.userMapper = userMapper;
        this.imageStorageService = imageStorageService;
    }

    @Transactional
    public Map<String, Object> loginUser(UserLoginRequestDTO loginRequest) {
        log.debug("Processing login for user: {}", loginRequest.getEmail());

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
            log.warn("Authentication failed for user: {}", loginRequest.getEmail());
            throw new InvalidUserCredentialsException("Invalid email or password");
        }

        // Get user details after authentication
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername());

        if (user == null) {
            log.error("User not found after authentication: {}", userDetails.getUsername());
            throw new UsernameNotFoundException("User not found");
        }else if(user.getAccountStatus() != AccountStatus.ACTIVE){
            log.error("User is not active: {}", userDetails.getUsername());
            throw new UserNotActiveException("User is not active");
        }

        userRepository.save(user);

        String accessToken = jwtUtils.generateTokenFromUsername(userDetails, user.getUserId());
        String refreshToken = refreshTokenService.createRefreshToken(user.getEmail()).getToken();
        UserLoginResponseDTO userDTO = UserMapper.toUserLoginResponseDTO(user);

        // Create response
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

    @Transactional
    public UserRegistrationResponseDTO registerUser(UserRegistrationRequestDTO userRegistrationDTO) {
        // Validate email
        if (!isValidEmail(userRegistrationDTO.getEmail())) {
            throw new InvalidEmailException("Invalid email format: " + userRegistrationDTO.getEmail());
        }

        if (userRepository.existsByEmail(userRegistrationDTO.getEmail())) {
            throw new EmailAlreadyInUseException("Email is already in use: " + userRegistrationDTO.getEmail());
        }

        String trimmedUserName = userRegistrationDTO.getUsername().replaceAll("\\s+", "");
        if (!isValidUsername(trimmedUserName)) {
            throw new InvalidUsernameException("Invalid username: " + trimmedUserName + ". Please try another.");
        }

        if (userRepository.existsByUsername(trimmedUserName)) {
            throw new UsernameAlreadyInUseException("username is already in use: " + trimmedUserName);
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

            // Create and save the user
            User user = userMapper.toEntity(
                    userRegistrationDTO,
                    passwordEncoder.encode(userRegistrationDTO.getPassword()),
                    profilePictureUrl
            );
            user.setUsername(trimmedUserName);
            userRepository.save(user);
            return UserMapper.toRegistrationResponseDTO(user);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while registering the user", e);
        }
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("User not found with email: " + email);
        }
        String token = UUID.randomUUID().toString().replaceAll("[^0-9]", "").substring(0, 6);
        EmailVerification emailVerification = new EmailVerification();
        emailVerification.setUserId(user.getUserId());
        emailVerification.setVerificationCode(token);
        emailVerification.setEmail(email);
        emailVerification.setStatus("pending");
        emailVerification.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        emailVerification.setCreatedAt(LocalDateTime.now());
        emailVerificationRepository.save(emailVerification);

        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    public void resetPassword(String token, String newPassword) {
        EmailVerification emailVerification = emailVerificationRepository.findByVerificationCode(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification code"));

        if (emailVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Verification code has expired");
        }

        User user = userRepository.findById(emailVerification.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        emailVerification.setStatus("verified");
        emailVerificationRepository.save(emailVerification);
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

    public void changePasswordById(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Page<User> getUsersByFilters(String status, String searchTerm, Pageable pageable) {

        AccountStatus profileStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                profileStatus = AccountStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid profile status: " + status);
            }
        }

        // Normalize search term
        String normalizedSearch = searchTerm != null ? searchTerm.trim() : null;
        if (normalizedSearch != null && normalizedSearch.isEmpty()) {
            normalizedSearch = null;
        }

        Page<User> users;
        if (normalizedSearch == null) {
            users = userRepository.findUsersWithFilters(profileStatus, pageable);
        } else {
            users = userRepository.findUsersWithFilters(profileStatus, normalizedSearch, pageable);
        }
        return users;
    }

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
    public void updateUserProfileStatus(Long userId, String accountStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        AccountStatus newAccountStatus;
        try {
            newAccountStatus = AccountStatus.valueOf(accountStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid profile status: " + accountStatus);
        }

        user.setAccountStatus(newAccountStatus);
        userRepository.save(user);
    }

    public void verifyUser(String verificationCode) {
        EmailVerification emailVerification = emailVerificationRepository.findByVerificationCode(verificationCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification code"));

        if (emailVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Verification code has expired");
        }

        emailVerification.setStatus("verified");
        emailVerificationRepository.save(emailVerification);

        User user = userRepository.findById(emailVerification.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if(user.getAccountStatus().equals(AccountStatus.SUSPENDED)){
            throw new UserAccountSuspendedException("User Account Suspended");
        }
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);
    }
    public void sendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }
        // Check if user is already verified
        if (user.getAccountStatus().equals(AccountStatus.ACTIVE)) {
            throw new EmailAlreadyVerifiedException("User is already verified");
        }
        String token = UUID.randomUUID().toString().substring(0, 10);
        EmailVerification emailVerification = new EmailVerification();
        emailVerification.setUserId(user.getUserId());
        emailVerification.setVerificationCode(token);
        emailVerification.setEmail(email);
        emailVerification.setExpiryTime(LocalDateTime.now().plusHours(24));
        emailVerification.setStatus("pending");
        emailVerification.setCreatedAt(LocalDateTime.now());
        emailVerificationRepository.save(emailVerification);

        emailService.sendVerificationEmail(user.getEmail(), token);
    }
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }
        if (user.getAccountStatus().equals(AccountStatus.ACTIVE)) {
            throw new EmailAlreadyVerifiedException("User is already verified");
        }
        EmailVerification emailVerification = emailVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No verification code found for user"));

        if (emailVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            emailVerification.setVerificationCode(UUID.randomUUID().toString().substring(0, 10));
            emailVerification.setExpiryTime(LocalDateTime.now().plusHours(24));
            emailVerification.setStatus("pending");
            emailVerification.setCreatedAt(LocalDateTime.now());
            emailVerificationRepository.save(emailVerification);
        }

        emailService.sendVerificationEmail(user.getEmail(), emailVerification.getVerificationCode());
    }

    @Transactional
    public UpdateUserProfileResponseDTO updateUserProfile(Long userId, UpdateUserProfileRequestDTO updateRequest) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        // Update basic user information
        UserMapper.updateUserFromDTO(user, updateRequest);

        // Handle profile picture update
        if (updateRequest.getProfilePicture() != null && !updateRequest.getProfilePicture().isEmpty()) {
            // Delete existing profile picture if exists
            if (user.getProfilePictureUrl() != null && !user.getProfilePictureUrl().isEmpty()) {
                imageStorageService.deleteImage(user.getProfilePictureUrl()).join();
            }
            // Upload new profile picture
            String profilePictureUrl = imageStorageService.uploadImage(updateRequest.getProfilePicture()).join();
            user.setProfilePictureUrl(profilePictureUrl);
        }

        // Handle cover photo update
        if (updateRequest.getCoverPhoto() != null && !updateRequest.getCoverPhoto().isEmpty()) {
            // Delete existing cover photo if exists
            if (user.getCoverPhotoUrl() != null && !user.getCoverPhotoUrl().isEmpty()) {
                imageStorageService.deleteImage(user.getCoverPhotoUrl()).join();
            }
            // Upload new cover photo
            String coverPhotoUrl = imageStorageService.uploadImage(updateRequest.getCoverPhoto()).join();
            user.setCoverPhotoUrl(coverPhotoUrl);
        }

        User updatedUser = userRepository.save(user);
        return UserMapper.toUpdateUserProfileResponseDTO(updatedUser);
    }
}