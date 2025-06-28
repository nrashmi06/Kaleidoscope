package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserNotificationPreferencesResponseDTO;
import com.kaleidoscope.backend.users.exception.notification.UserNotificationPreferencesNotFoundException;
import com.kaleidoscope.backend.users.exception.user.UserNotFoundException;
import com.kaleidoscope.backend.users.mapper.UserNotificationPreferencesMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserNotificationPreferences;
import com.kaleidoscope.backend.users.repository.UserNotificationPreferencesRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.users.service.UserNotificationPreferencesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserNotificationPreferencesServiceImpl implements UserNotificationPreferencesService {

    private final UserNotificationPreferencesRepository notificationPreferencesRepository;
    private final UserRepository userRepository;
    private final UserNotificationPreferencesMapper notificationPreferencesMapper;
    private final JwtUtils jwtUtils;

    @Override
    @Transactional(readOnly = true)
    public UserNotificationPreferencesResponseDTO getNotificationPreferences() {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);
        return notificationPreferencesMapper.toResponseDTO(preferences);
    }

    @Override
    @Transactional(readOnly = true)
    public UserNotificationPreferencesResponseDTO getNotificationPreferencesByUserId(Long userId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();

        // Only allow users to view their own preferences or admin access
        if (!currentUserId.equals(userId) && !jwtUtils.isAdminFromContext()) {
            throw new AccessDeniedException("Access denied: Cannot view other users' notification preferences");
        }

        UserNotificationPreferences preferences = notificationPreferencesRepository.findByUserUserId(userId)
                .orElseThrow(() -> new UserNotificationPreferencesNotFoundException(
                        "Notification preferences not found for user ID: " + userId));

        return notificationPreferencesMapper.toResponseDTO(preferences);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserNotificationPreferencesResponseDTO> getAllNotificationPreferences(Pageable pageable) {
        // Admin only feature
        if (!jwtUtils.isAdminFromContext()) {
            throw new AccessDeniedException("Access denied: Admin privileges required");
        }

        Page<UserNotificationPreferences> preferencesPage = notificationPreferencesRepository.findAll(pageable);
        return preferencesPage.map(notificationPreferencesMapper::toResponseDTO);
    }

    @Override
    public UserNotificationPreferencesResponseDTO updateNotificationPreferences(UpdateNotificationPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.updateFromDTO(preferences, requestDTO);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("Notification preferences updated successfully for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO updateLikesPreferences(UpdateLikesPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.updateFromLikesDTO(preferences, requestDTO);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("Likes notification preferences updated successfully for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO updateCommentsPreferences(UpdateCommentsPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.updateFromCommentsDTO(preferences, requestDTO);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("Comments notification preferences updated successfully for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO updateFollowsPreferences(UpdateFollowsPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.updateFromFollowsDTO(preferences, requestDTO);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("Follows notification preferences updated successfully for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO updateMentionsPreferences(UpdateMentionsPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.updateFromMentionsDTO(preferences, requestDTO);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("Mentions notification preferences updated successfully for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO updateSystemPreferences(UpdateSystemPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.updateFromSystemDTO(preferences, requestDTO);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("System notification preferences updated successfully for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO updateEmailPreferences(UpdateEmailPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.updateFromEmailDTO(preferences, requestDTO);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("Email notification preferences updated successfully for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO updatePushPreferences(UpdatePushPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.updateFromPushDTO(preferences, requestDTO);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("Push notification preferences updated successfully for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO enableAllEmailNotifications() {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.enableAllEmail(preferences);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("All email notifications enabled for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO disableAllEmailNotifications() {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.disableAllEmail(preferences);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("All email notifications disabled for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO enableAllPushNotifications() {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.enableAllPush(preferences);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("All push notifications enabled for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO disableAllPushNotifications() {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.disableAllPush(preferences);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("All push notifications disabled for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO resetToDefaults() {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        UserNotificationPreferences updatedPreferences = notificationPreferencesMapper.resetToDefaults(preferences);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(updatedPreferences);
        log.info("Notification preferences reset to defaults for user ID: {}", currentUserId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    public UserNotificationPreferencesResponseDTO createDefaultNotificationPreferences(Long userId) {
        // Validate that the user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        // Check if preferences already exist
        if (notificationPreferencesRepository.findByUserUserId(userId).isPresent()) {
            throw new IllegalArgumentException("Notification preferences already exist for user ID: " + userId);
        }

        // Create new preferences using mapper
        UserNotificationPreferences newPreferences = notificationPreferencesMapper.toEntity(user);
        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(newPreferences);
        log.info("Created default notification preferences for user ID: {}", userId);

        return notificationPreferencesMapper.toResponseDTO(savedPreferences);
    }

    private UserNotificationPreferences getOrCreateNotificationPreferences(Long userId) {
        return notificationPreferencesRepository.findByUserUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

                    UserNotificationPreferences newPreferences = notificationPreferencesMapper.toEntity(user);
                    UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(newPreferences);
                    log.info("Created default notification preferences for user ID: {}", userId);

                    return savedPreferences;
                });
    }
}
