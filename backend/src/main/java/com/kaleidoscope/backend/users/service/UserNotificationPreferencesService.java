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

    UserNotificationPreferencesResponseDTO updateLikesPreferences(UpdateLikesPreferencesRequestDTO requestDTO);

    UserNotificationPreferencesResponseDTO updateCommentsPreferences(UpdateCommentsPreferencesRequestDTO requestDTO);

    UserNotificationPreferencesResponseDTO updateFollowsPreferences(UpdateFollowsPreferencesRequestDTO requestDTO);

    UserNotificationPreferencesResponseDTO updateMentionsPreferences(UpdateMentionsPreferencesRequestDTO requestDTO);

    UserNotificationPreferencesResponseDTO updateSystemPreferences(UpdateSystemPreferencesRequestDTO requestDTO);

    UserNotificationPreferencesResponseDTO updateEmailPreferences(UpdateEmailPreferencesRequestDTO requestDTO);

    UserNotificationPreferencesResponseDTO updatePushPreferences(UpdatePushPreferencesRequestDTO requestDTO);

    UserNotificationPreferencesResponseDTO enableAllEmailNotifications();

    UserNotificationPreferencesResponseDTO disableAllEmailNotifications();

    UserNotificationPreferencesResponseDTO enableAllPushNotifications();

    UserNotificationPreferencesResponseDTO disableAllPushNotifications();

    UserNotificationPreferencesResponseDTO resetToDefaults();

    UserNotificationPreferencesResponseDTO createDefaultNotificationPreferences(Long userId);
}
