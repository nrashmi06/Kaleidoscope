package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserPreferencesResponseDTO;
import com.kaleidoscope.backend.users.enums.Theme;
import com.kaleidoscope.backend.users.enums.Visibility;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserPreferences;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class UserPreferencesMapper {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Instance method for creating new entity (like UserMapper.toEntity)
    public UserPreferences toEntity(User user) {
        return UserPreferences.builder()
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
    }

    // Instance method for entity to response DTO (like UserMapper.toUserLoginResponseDTO)
    public UserPreferencesResponseDTO toResponseDTO(UserPreferences userPreferences) {
        return UserPreferencesResponseDTO.builder()
                .preferenceId(userPreferences.getPreferenceId())
                .userId(userPreferences.getUser().getUserId())
                .theme(userPreferences.getTheme().name())
                .language(userPreferences.getLanguage())
                .profileVisibility(userPreferences.getProfileVisibility().name())
                .allowMessages(userPreferences.getAllowMessages().name())
                .allowTagging(userPreferences.getAllowTagging().name())
                .viewActivity(userPreferences.getViewActivity().name())
                .showEmail(userPreferences.getShowEmail())
                .showPhone(userPreferences.getShowPhone())
                .showOnlineStatus(userPreferences.getShowOnlineStatus())
                .searchDiscoverable(userPreferences.getSearchDiscoverable())
                .createdAt(userPreferences.getCreatedAt().format(FORMATTER))
                .updatedAt(userPreferences.getUpdatedAt().format(FORMATTER))
                .build();
    }

    // Instance update method (like UserMapper.updateUserFromDTO)
    public UserPreferences updateFromDTO(UserPreferences preferences, UpdateUserPreferencesRequestDTO dto) {
        preferences.setTheme(dto.theme());
        preferences.setLanguage(dto.language());
        preferences.setProfileVisibility(dto.profileVisibility());
        preferences.setAllowMessages(dto.allowMessages());
        preferences.setAllowTagging(dto.allowTagging());
        preferences.setViewActivity(dto.viewActivity());
        preferences.setShowEmail(dto.showEmail());
        preferences.setShowPhone(dto.showPhone());
        preferences.setShowOnlineStatus(dto.showOnlineStatus());
        preferences.setSearchDiscoverable(dto.searchDiscoverable());
        return preferences;
    }

    // Granular instance update methods for specific preference categories
    public UserPreferences updateTheme(UserPreferences preferences, Theme theme) {
        preferences.setTheme(theme);
        return preferences;
    }

    public UserPreferences updateLanguage(UserPreferences preferences, String language) {
        preferences.setLanguage(language);
        return preferences;
    }

    public UserPreferences updatePrivacySettings(UserPreferences preferences,
                                                       Visibility profileVisibility,
                                                       Visibility allowMessages,
                                                       Visibility allowTagging) {
        preferences.setProfileVisibility(profileVisibility);
        preferences.setAllowMessages(allowMessages);
        preferences.setAllowTagging(allowTagging);
        return preferences;
    }

    public UserPreferences updateVisibilitySettings(UserPreferences preferences,
                                                          Boolean showEmail,
                                                          Boolean showPhone,
                                                          Boolean showOnlineStatus,
                                                          Boolean searchDiscoverable,
                                                          Visibility viewActivity) {
        preferences.setShowEmail(showEmail);
        preferences.setShowPhone(showPhone);
        preferences.setShowOnlineStatus(showOnlineStatus);
        preferences.setSearchDiscoverable(searchDiscoverable);
        preferences.setViewActivity(viewActivity);
        return preferences;
    }

    // Instance methods for DTO-based updates
    public UserPreferences updateFromPrivacySettingsDTO(UserPreferences preferences, UpdatePrivacySettingsRequestDTO dto) {
        preferences.setShowEmail(dto.showEmail());
        preferences.setShowPhone(dto.showPhone());
        preferences.setShowOnlineStatus(dto.showOnlineStatus());
        preferences.setSearchDiscoverable(dto.searchDiscoverable());
        return preferences;
    }

    public UserPreferences updateFromVisibilitySettingsDTO(UserPreferences preferences, UpdateVisibilitySettingsRequestDTO dto) {
        preferences.setProfileVisibility(dto.profileVisibility());
        preferences.setAllowMessages(dto.allowMessages());
        preferences.setAllowTagging(dto.allowTagging());
        preferences.setViewActivity(dto.viewActivity());
        return preferences;
    }
}
