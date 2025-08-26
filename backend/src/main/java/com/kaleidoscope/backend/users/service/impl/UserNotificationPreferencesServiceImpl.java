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
    public UserNotificationPreferencesResponseDTO partialUpdateNotificationPreferences(PartialUpdateNotificationPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserNotificationPreferences preferences = getOrCreateNotificationPreferences(currentUserId);

        if (requestDTO.getLikesEmail() != null) preferences.setLikesEmail(requestDTO.getLikesEmail());
        if (requestDTO.getLikesPush() != null) preferences.setLikesPush(requestDTO.getLikesPush());
        if (requestDTO.getCommentsEmail() != null) preferences.setCommentsEmail(requestDTO.getCommentsEmail());
        if (requestDTO.getCommentsPush() != null) preferences.setCommentsPush(requestDTO.getCommentsPush());
        if (requestDTO.getFollowsEmail() != null) preferences.setFollowsEmail(requestDTO.getFollowsEmail());
        if (requestDTO.getFollowsPush() != null) preferences.setFollowsPush(requestDTO.getFollowsPush());
        if (requestDTO.getMentionsEmail() != null) preferences.setMentionsEmail(requestDTO.getMentionsEmail());
        if (requestDTO.getMentionsPush() != null) preferences.setMentionsPush(requestDTO.getMentionsPush());
        if (requestDTO.getSystemEmail() != null) preferences.setSystemEmail(requestDTO.getSystemEmail());
        if (requestDTO.getSystemPush() != null) preferences.setSystemPush(requestDTO.getSystemPush());

        UserNotificationPreferences savedPreferences = notificationPreferencesRepository.save(preferences);
        log.info("Notification preferences partially updated for user ID: {}", currentUserId);

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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        if (notificationPreferencesRepository.findByUserUserId(userId).isPresent()) {
            throw new IllegalArgumentException("Notification preferences already exist for user ID: " + userId);
        }

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
