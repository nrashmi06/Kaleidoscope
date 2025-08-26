package com.kaleidoscope.backend.users.service;

import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserNotificationPreferencesResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserNotificationPreferencesService {

    UserNotificationPreferencesResponseDTO getNotificationPreferences();

    UserNotificationPreferencesResponseDTO getNotificationPreferencesByUserId(Long userId);

    Page<UserNotificationPreferencesResponseDTO> getAllNotificationPreferences(Pageable pageable);

    UserNotificationPreferencesResponseDTO updateNotificationPreferences(UpdateNotificationPreferencesRequestDTO requestDTO);

    UserNotificationPreferencesResponseDTO partialUpdateNotificationPreferences(PartialUpdateNotificationPreferencesRequestDTO requestDTO);

    UserNotificationPreferencesResponseDTO resetToDefaults();

    UserNotificationPreferencesResponseDTO createDefaultNotificationPreferences(Long userId);
}
