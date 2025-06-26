package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.dto.response.UserPreferencesResponseDTO;
import com.kaleidoscope.backend.users.model.UserPreferences;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class UserPreferencesMapper {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static UserPreferencesResponseDTO mapToResponseDTO(UserPreferences userPreferences) {
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
}
