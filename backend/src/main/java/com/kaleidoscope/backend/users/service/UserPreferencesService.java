package com.kaleidoscope.backend.users.service;

import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserPreferencesResponseDTO;

public interface UserPreferencesService {

    UserPreferencesResponseDTO getUserPreferences();

    UserPreferencesResponseDTO getUserPreferencesByUserId(Long userId);

    UserPreferencesResponseDTO updateUserPreferences(UpdateUserPreferencesRequestDTO requestDTO);

    UserPreferencesResponseDTO updateTheme(UpdateThemeRequestDTO requestDTO);

    UserPreferencesResponseDTO updateLanguage(UpdateLanguageRequestDTO requestDTO);

    UserPreferencesResponseDTO updatePrivacySettings(UpdatePrivacySettingsRequestDTO requestDTO);

    UserPreferencesResponseDTO updateVisibilitySettings(UpdateVisibilitySettingsRequestDTO requestDTO);
}
