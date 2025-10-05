package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserPreferencesResponseDTO;
import com.kaleidoscope.backend.users.exception.user.UserNotFoundException;
import com.kaleidoscope.backend.users.exception.user.UserPreferencesNotFoundException;
import com.kaleidoscope.backend.users.mapper.UserPreferencesMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserPreferences;
import com.kaleidoscope.backend.users.repository.UserPreferencesRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.users.service.UserPreferencesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserPreferencesServiceImpl implements UserPreferencesService {

    private final UserPreferencesRepository userPreferencesRepository;
    private final UserRepository userRepository;
    private final UserPreferencesMapper userPreferencesMapper;
    private final JwtUtils jwtUtils;

    @Override
    @Transactional(readOnly = true)
    public UserPreferencesResponseDTO getUserPreferences() {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getOrCreateUserPreferences(currentUserId);
        return userPreferencesMapper.toResponseDTO(userPreferences);
    }

    @Override
    @Transactional(readOnly = true)
    public UserPreferencesResponseDTO getUserPreferencesByUserId(Long userId) {
        // Validate access - only admins or the user themselves can access preferences
        Long currentUserId = jwtUtils.getUserIdFromContext();
        String currentUserRoleStr = jwtUtils.getRoleFromContext();
        if (currentUserRoleStr.startsWith("ROLE_")) {
            currentUserRoleStr = currentUserRoleStr.substring(5);
        }
        Role currentUserRole = Role.valueOf(currentUserRoleStr);

        if (!Role.ADMIN.equals(currentUserRole) && !currentUserId.equals(userId)) {
            throw new IllegalArgumentException("Access denied: Cannot view other user's preferences");
        }

        UserPreferences userPreferences = getUserPreferencesByUserIdInternal(userId);
        return userPreferencesMapper.toResponseDTO(userPreferences);
    }

    @Override
    @Transactional
    public UserPreferencesResponseDTO updateUserPreferences(UpdateUserPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getOrCreateUserPreferences(currentUserId);

        // Use mapper instance method to update all fields
        UserPreferences updatedPreferences = userPreferencesMapper.updateFromDTO(userPreferences, requestDTO);
        UserPreferences savedPreferences = userPreferencesRepository.save(updatedPreferences);
        log.info("Updated user preferences for user ID: {}", currentUserId);

        return userPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    @Transactional
    public UserPreferencesResponseDTO updateTheme(UpdateThemeRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getOrCreateUserPreferences(currentUserId);

        // Use mapper instance method to update theme
        UserPreferences updatedPreferences = userPreferencesMapper.updateTheme(userPreferences, requestDTO.theme());
        UserPreferences savedPreferences = userPreferencesRepository.save(updatedPreferences);
        log.info("Updated theme to {} for user ID: {}", requestDTO.theme(), currentUserId);

        return userPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    @Transactional
    public UserPreferencesResponseDTO updateLanguage(UpdateLanguageRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getOrCreateUserPreferences(currentUserId);

        // Use mapper instance method to update language
        UserPreferences updatedPreferences = userPreferencesMapper.updateLanguage(userPreferences, requestDTO.language());
        UserPreferences savedPreferences = userPreferencesRepository.save(updatedPreferences);
        log.info("Updated language to {} for user ID: {}", requestDTO.language(), currentUserId);

        return userPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    @Transactional
    public UserPreferencesResponseDTO updatePrivacySettings(UpdatePrivacySettingsRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getOrCreateUserPreferences(currentUserId);

        // Use the DTO-specific mapper instance method
        UserPreferences updatedPreferences = userPreferencesMapper.updateFromPrivacySettingsDTO(userPreferences, requestDTO);
        UserPreferences savedPreferences = userPreferencesRepository.save(updatedPreferences);
        log.info("Updated privacy settings for user ID: {}", currentUserId);

        return userPreferencesMapper.toResponseDTO(savedPreferences);
    }

    @Override
    @Transactional
    public UserPreferencesResponseDTO updateVisibilitySettings(UpdateVisibilitySettingsRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getOrCreateUserPreferences(currentUserId);

        // Use the DTO-specific mapper instance method
        UserPreferences updatedPreferences = userPreferencesMapper.updateFromVisibilitySettingsDTO(userPreferences, requestDTO);
        UserPreferences savedPreferences = userPreferencesRepository.save(updatedPreferences);
        log.info("Updated visibility settings for user ID: {}", currentUserId);

        return userPreferencesMapper.toResponseDTO(savedPreferences);
    }

    private UserPreferences getUserPreferencesByUserIdInternal(Long userId) {
        return userPreferencesRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new UserPreferencesNotFoundException(
                        "User preferences not found for user ID: " + userId));
    }

    private UserPreferences getOrCreateUserPreferences(Long userId) {
        return userPreferencesRepository.findByUser_UserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

                    UserPreferences newPreferences = userPreferencesMapper.toEntity(user);
                    UserPreferences savedPreferences = userPreferencesRepository.save(newPreferences);
                    log.info("Created default user preferences for user ID: {}", userId);

                    return savedPreferences;
                });
    }
}
