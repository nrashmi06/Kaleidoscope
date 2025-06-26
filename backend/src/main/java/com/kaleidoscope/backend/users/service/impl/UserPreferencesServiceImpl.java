package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserPreferencesResponseDTO;
import com.kaleidoscope.backend.users.exception.user.UserPreferencesNotFoundException;
import com.kaleidoscope.backend.users.mapper.UserPreferencesMapper;
import com.kaleidoscope.backend.users.model.UserPreferences;
import com.kaleidoscope.backend.users.repository.UserPreferencesRepository;
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
    private final JwtUtils jwtUtils;

    @Override
    @Transactional(readOnly = true)
    public UserPreferencesResponseDTO getUserPreferences() {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getUserPreferencesByUserIdInternal(currentUserId);
        return UserPreferencesMapper.mapToResponseDTO(userPreferences);
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
        return UserPreferencesMapper.mapToResponseDTO(userPreferences);
    }

    @Override
    @Transactional
    public UserPreferencesResponseDTO updateUserPreferences(UpdateUserPreferencesRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getUserPreferencesByUserIdInternal(currentUserId);

        // Update all fields
        userPreferences.setTheme(requestDTO.getTheme());
        userPreferences.setLanguage(requestDTO.getLanguage());
        userPreferences.setProfileVisibility(requestDTO.getProfileVisibility());
        userPreferences.setAllowMessages(requestDTO.getAllowMessages());
        userPreferences.setAllowTagging(requestDTO.getAllowTagging());
        userPreferences.setViewActivity(requestDTO.getViewActivity());
        userPreferences.setShowEmail(requestDTO.getShowEmail());
        userPreferences.setShowPhone(requestDTO.getShowPhone());
        userPreferences.setShowOnlineStatus(requestDTO.getShowOnlineStatus());
        userPreferences.setSearchDiscoverable(requestDTO.getSearchDiscoverable());

        UserPreferences savedPreferences = userPreferencesRepository.save(userPreferences);
        log.info("Updated user preferences for user ID: {}", currentUserId);

        return UserPreferencesMapper.mapToResponseDTO(savedPreferences);
    }

    @Override
    @Transactional
    public UserPreferencesResponseDTO updateTheme(UpdateThemeRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getUserPreferencesByUserIdInternal(currentUserId);

        userPreferences.setTheme(requestDTO.getTheme());

        UserPreferences savedPreferences = userPreferencesRepository.save(userPreferences);
        log.info("Updated theme to {} for user ID: {}", requestDTO.getTheme(), currentUserId);

        return UserPreferencesMapper.mapToResponseDTO(savedPreferences);
    }

    @Override
    @Transactional
    public UserPreferencesResponseDTO updateLanguage(UpdateLanguageRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getUserPreferencesByUserIdInternal(currentUserId);

        userPreferences.setLanguage(requestDTO.getLanguage());

        UserPreferences savedPreferences = userPreferencesRepository.save(userPreferences);
        log.info("Updated language to {} for user ID: {}", requestDTO.getLanguage(), currentUserId);

        return UserPreferencesMapper.mapToResponseDTO(savedPreferences);
    }

    @Override
    @Transactional
    public UserPreferencesResponseDTO updatePrivacySettings(UpdatePrivacySettingsRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getUserPreferencesByUserIdInternal(currentUserId);

        userPreferences.setShowEmail(requestDTO.getShowEmail());
        userPreferences.setShowPhone(requestDTO.getShowPhone());
        userPreferences.setShowOnlineStatus(requestDTO.getShowOnlineStatus());
        userPreferences.setSearchDiscoverable(requestDTO.getSearchDiscoverable());

        UserPreferences savedPreferences = userPreferencesRepository.save(userPreferences);
        log.info("Updated privacy settings for user ID: {}", currentUserId);

        return UserPreferencesMapper.mapToResponseDTO(savedPreferences);
    }

    @Override
    @Transactional
    public UserPreferencesResponseDTO updateVisibilitySettings(UpdateVisibilitySettingsRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        UserPreferences userPreferences = getUserPreferencesByUserIdInternal(currentUserId);

        userPreferences.setProfileVisibility(requestDTO.getProfileVisibility());
        userPreferences.setAllowMessages(requestDTO.getAllowMessages());
        userPreferences.setAllowTagging(requestDTO.getAllowTagging());
        userPreferences.setViewActivity(requestDTO.getViewActivity());

        UserPreferences savedPreferences = userPreferencesRepository.save(userPreferences);
        log.info("Updated visibility settings for user ID: {}", currentUserId);

        return UserPreferencesMapper.mapToResponseDTO(savedPreferences);
    }

    private UserPreferences getUserPreferencesByUserIdInternal(Long userId) {
        return userPreferencesRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new UserPreferencesNotFoundException(
                        "User preferences not found for user ID: " + userId));
    }
}
