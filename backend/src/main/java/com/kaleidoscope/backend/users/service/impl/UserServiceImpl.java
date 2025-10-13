package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.async.dto.ProfilePictureEventDTO;
import com.kaleidoscope.backend.async.service.RedisStreamPublisher;
import com.kaleidoscope.backend.async.streaming.ProducerStreamConstants;
import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.shared.exception.other.UserNotFoundException;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileRequestDTO;
import com.kaleidoscope.backend.users.dto.response.UpdateUserProfileResponseDTO;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.users.service.UserDocumentSyncService;
import com.kaleidoscope.backend.users.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ImageStorageService imageStorageService;
    private final RedisStreamPublisher redisStreamPublisher;
    private final UserDocumentSyncService userDocumentSyncService;

    public UserServiceImpl(UserRepository userRepository,
                           ImageStorageService imageStorageService,
                           RedisStreamPublisher redisStreamPublisher,
                           UserDocumentSyncService userDocumentSyncService) {
        this.userRepository = userRepository;
        this.imageStorageService = imageStorageService;
        this.redisStreamPublisher = redisStreamPublisher;
        this.userDocumentSyncService = userDocumentSyncService;
    }

    @Override
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
    }

    @Override
    public User getUserByEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }
        return user;
    }

    @Override
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

    @Override
    @Transactional
    public void updateUserProfileStatus(Long userId, String accountStatus) {
        User user = getUserById(userId);

        AccountStatus newAccountStatus;
        try {
            newAccountStatus = AccountStatus.valueOf(accountStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid profile status: " + accountStatus);
        }

        user.setAccountStatus(newAccountStatus);
        userRepository.save(user);

        log.info("Updated account status for user ID {} to {}", userId, newAccountStatus);
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
    @Transactional
    public UpdateUserProfileResponseDTO updateUserProfile(Long userId, UpdateUserProfileRequestDTO updateRequest) throws Exception {
        User user = getUserById(userId);

        String oldProfilePictureUrl = user.getProfilePictureUrl();
        String oldCoverPhotoUrl = user.getCoverPhotoUrl();

        String newProfilePictureUrl = null;
        String newCoverPhotoUrl = null;

        try {
            UserMapper.updateUserFromDTO(user, updateRequest);

            // Handle profile picture update with organized folder structure
            if (updateRequest.getProfilePicture() != null && !updateRequest.getProfilePicture().isEmpty()) {
                newProfilePictureUrl = imageStorageService.uploadUserProfileImage(
                        updateRequest.getProfilePicture(), userId.toString()).join();
                user.setProfilePictureUrl(newProfilePictureUrl);
            }

            // Handle cover photo update with organized folder structure
            if (updateRequest.getCoverPhoto() != null && !updateRequest.getCoverPhoto().isEmpty()) {
                newCoverPhotoUrl = imageStorageService.uploadUserCoverPhoto(
                        updateRequest.getCoverPhoto(), userId.toString()).join();
                user.setCoverPhotoUrl(newCoverPhotoUrl);
            }

            user = userRepository.save(user);

            // Trigger Elasticsearch sync for denormalized author data in posts
            try {
                Map<String, Object> profileSyncPayload = Map.of("userId", userId);
                redisStreamPublisher.publish(ProducerStreamConstants.USER_PROFILE_POST_SYNC_STREAM, profileSyncPayload);
                log.debug("Published USER_PROFILE_POST_SYNC_STREAM event for user {}", userId);
            } catch (Exception e) {
                log.error("Failed to publish user profile sync event for user {}: {}",
                         userId, e.getMessage(), e);
                // Continue execution even if stream publishing fails
            }

            if (newProfilePictureUrl != null && !newProfilePictureUrl.trim().isEmpty()) {
                // Publish to Redis Stream for ML processing - only when image URL exists
                log.info("Publishing profile picture event for user {}: imageUrl={}", userId, newProfilePictureUrl);
                ProfilePictureEventDTO event = ProfilePictureEventDTO.builder()
                    .userId(userId)
                    .imageUrl(newProfilePictureUrl)
                    .correlationId(MDC.get("correlationId"))
                    .build();
                redisStreamPublisher.publish(ProducerStreamConstants.PROFILE_PICTURE_PROCESSING_STREAM, event);
            } else {
                log.debug("Skipping Redis Stream publishing for user {} - no profile picture URL", userId);
            }

            // Delete old images after successful save
            if (newProfilePictureUrl != null && oldProfilePictureUrl != null && !oldProfilePictureUrl.isEmpty()) {
                imageStorageService.deleteImage(oldProfilePictureUrl).join();
            }
            if (newCoverPhotoUrl != null && oldCoverPhotoUrl != null && !oldCoverPhotoUrl.isEmpty()) {
                imageStorageService.deleteImage(oldCoverPhotoUrl).join();
            }

            // Sync user document after profile update
            userDocumentSyncService.syncOnProfileUpdate(userId);

            return UserMapper.toUpdateUserProfileResponseDTO(user);

        } catch (Exception e) {
            // Cleanup any uploaded images if user save failed
            if (newProfilePictureUrl != null) {
                imageStorageService.deleteImage(newProfilePictureUrl).join();
            }
            if (newCoverPhotoUrl != null) {
                imageStorageService.deleteImage(newCoverPhotoUrl).join();
            }
            throw e;
        }
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
