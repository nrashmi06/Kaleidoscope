package com.kaleidoscope.backend.auth.service.impl;

import com.kaleidoscope.backend.async.dto.ProfilePictureEventDTO;
import com.kaleidoscope.backend.async.service.RedisStreamPublisher;
import com.kaleidoscope.backend.async.streaming.ProducerStreamConstants;
import com.kaleidoscope.backend.auth.dto.request.UserRegistrationRequestDTO;
import com.kaleidoscope.backend.auth.dto.response.UserRegistrationResponseDTO;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyInUseException;
import com.kaleidoscope.backend.auth.exception.email.InvalidEmailException;
import com.kaleidoscope.backend.auth.model.EmailVerification;
import com.kaleidoscope.backend.auth.repository.EmailVerificationRepository;
import com.kaleidoscope.backend.auth.service.EmailService;
import com.kaleidoscope.backend.auth.service.UserRegistrationService;
import com.kaleidoscope.backend.shared.exception.Image.ImageStorageException;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.users.enums.Theme;
import com.kaleidoscope.backend.users.enums.Visibility;
import com.kaleidoscope.backend.users.exception.user.InvalidUsernameException;
import com.kaleidoscope.backend.users.exception.user.UsernameAlreadyInUseException;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserNotificationPreferences;
import com.kaleidoscope.backend.users.model.UserPreferences;
import com.kaleidoscope.backend.users.repository.UserNotificationPreferencesRepository;
import com.kaleidoscope.backend.users.repository.UserPreferencesRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserRegistrationServiceImpl implements UserRegistrationService {

    @Value("${spring.app.defaults.cover-photo-url}")
    private String defaultCoverPhotoUrl;

    private final UserRepository userRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final UserNotificationPreferencesRepository userNotificationPreferencesRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final ImageStorageService imageStorageService;
    private final EmailService emailService;
    private final RedisStreamPublisher redisStreamPublisher;

    @Override
    @Transactional
    public UserRegistrationResponseDTO registerUser(UserRegistrationRequestDTO userRegistrationDTO) {
        log.info("Starting user registration for email: {}", userRegistrationDTO.getEmail());

        // Step 1: Validate input (let global exception handler manage exceptions)
        validateUserInput(userRegistrationDTO);

        // Step 2: Create and save user
        User user = createUser(userRegistrationDTO);

        // Step 3: Handle profile image upload if provided
        handleProfileImageUpload(user, userRegistrationDTO);

        // Step 4: Create default preferences
        createDefaultPreferences(user);

        // Step 5: Send verification email (don't let email failures break registration)
        sendVerificationEmailSafely(user);

        log.info("User registration completed successfully for email: {}", user.getEmail());
        return UserMapper.toRegistrationResponseDTO(user);
    }

    private void validateUserInput(UserRegistrationRequestDTO dto) {
        // Validate email format
        if (!isValidEmail(dto.getEmail())) {
            throw new InvalidEmailException("Invalid email format: " + dto.getEmail());
        }

        // Check email availability
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new EmailAlreadyInUseException("Email is already in use: " + dto.getEmail());
        }

        // Validate and check username
        String trimmedUsername = dto.getUsername().replaceAll("\\s+", "");
        if (!isValidUsername(trimmedUsername)) {
            throw new InvalidUsernameException("Invalid username: " + trimmedUsername + ". Please try another.");
        }

        if (userRepository.existsByUsername(trimmedUsername)) {
            throw new UsernameAlreadyInUseException("Username is already taken: " + trimmedUsername + ". Please try another.");
        }
    }

    private User createUser(UserRegistrationRequestDTO dto) {
        String trimmedUsername = dto.getUsername().replaceAll("\\s+", "");
        String encodedPassword = passwordEncoder.encode(dto.getPassword());

        User user = userMapper.toEntity(dto, encodedPassword, null);
        user.setUsername(trimmedUsername);
        user.setCoverPhotoUrl(defaultCoverPhotoUrl);

        return userRepository.save(user);
    }

    private void handleProfileImageUpload(User user, UserRegistrationRequestDTO dto) {
        if (dto.getProfilePicture() != null && !dto.getProfilePicture().isEmpty()) {
            try {
                String profilePictureUrl = imageStorageService.uploadUserProfileImage(
                        dto.getProfilePicture(),
                        user.getUserId().toString()
                ).get();

                user.setProfilePictureUrl(profilePictureUrl);
                userRepository.save(user);
                log.debug("Profile picture uploaded for user ID: {}", user.getUserId());

                // Publish profile picture event to Redis Stream
                publishProfilePictureEvent(user, profilePictureUrl);
            } catch (Exception e) {
                log.error("Failed to upload profile picture for user ID: {}", user.getUserId(), e);
                throw new ImageStorageException("Failed to upload profile picture");
            }
        }
    }

    private void publishProfilePictureEvent(User user, String profilePictureUrl) {
        if (profilePictureUrl != null && !profilePictureUrl.trim().isEmpty()) {
            try {
                log.info("Publishing profile picture event for newly registered user {}: imageUrl={}", user.getUserId(), profilePictureUrl);
                ProfilePictureEventDTO event = ProfilePictureEventDTO.builder()
                    .userId(user.getUserId())
                    .imageUrl(profilePictureUrl)
                    .correlationId(MDC.get("correlationId"))
                    .build();

                redisStreamPublisher.publish(ProducerStreamConstants.PROFILE_PICTURE_PROCESSING_STREAM, event);
            } catch (Exception e) {
                log.error("Failed to publish profile picture event to Redis Stream for user ID: {}", user.getUserId(), e);
            }
        } else {
            log.debug("Skipping Redis Stream publishing for newly registered user {} - no profile picture URL", user.getUserId());
        }
    }

    private void createDefaultPreferences(User user) {
        // Create default user preferences
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

        // Create default notification preferences
        UserNotificationPreferences notificationPreferences = UserNotificationPreferences.builder()
                .user(user)
                .likesEmail(true)
                .likesPush(true)
                .commentsEmail(true)
                .commentsPush(true)
                .followsEmail(true)
                .followsPush(true)
                .mentionsEmail(true)
                .mentionsPush(true)
                .systemEmail(true)
                .systemPush(true)
                .build();

        userNotificationPreferencesRepository.save(notificationPreferences);
        log.debug("Created default preferences for user ID: {}", user.getUserId());
    }

    private void sendVerificationEmailSafely(User user) {
        try {
            String token = generateVerificationToken();

            // Create email verification record
            EmailVerification emailVerification = new EmailVerification();
            emailVerification.setUserId(user.getUserId());
            emailVerification.setEmail(user.getEmail());
            emailVerification.setVerificationCode(token);
            emailVerification.setExpiryTime(LocalDateTime.now().plusHours(24));
            emailVerification.setStatus("pending");
            emailVerification.setCreatedAt(LocalDateTime.now());

            emailVerificationRepository.save(emailVerification);
            emailService.sendVerificationEmail(user.getEmail(), token);

            log.debug("Verification email sent for user: {}", user.getEmail());
        } catch (Exception e) {
            // Don't let email sending failures break user registration
            log.error("Failed to send verification email for user: {}, error: {}", user.getEmail(), e.getMessage());
        }
    }

    private String generateVerificationToken() {
        return java.util.UUID.randomUUID().toString().substring(0, 10);
    }

    private boolean isValidEmail(String email) {
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
        return email != null && email.matches(emailRegex);
    }

    private boolean isValidUsername(String username) {
        return username != null &&
                !username.trim().isEmpty() &&
                username.matches("^[a-zA-Z0-9 ._-]{3,}$");
    }
}
