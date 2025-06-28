package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserNotificationPreferencesResponseDTO;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserNotificationPreferences;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class UserNotificationPreferencesMapper {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Instance method for creating new entity (like UserMapper.toEntity)
    public UserNotificationPreferences toEntity(User user) {
        return UserNotificationPreferences.builder()
                .user(user)
                .likesEmail(true)
                .likesPush(true)
                .commentsEmail(true)
                .commentsPush(true)
                .followsEmail(true)
                .followsPush(true)
                .mentionsEmail(true)
                .mentionsPush(true)
                .systemEmail(true)
                .systemPush(true)
                .build();
    }

    // Instance method for entity to response DTO (like UserMapper.toUserLoginResponseDTO)
    public UserNotificationPreferencesResponseDTO toResponseDTO(UserNotificationPreferences preferences) {
        return UserNotificationPreferencesResponseDTO.builder()
                .preferenceId(preferences.getPreferenceId())
                .userId(preferences.getUser().getUserId())
                .likesEmail(preferences.getLikesEmail())
                .likesPush(preferences.getLikesPush())
                .commentsEmail(preferences.getCommentsEmail())
                .commentsPush(preferences.getCommentsPush())
                .followsEmail(preferences.getFollowsEmail())
                .followsPush(preferences.getFollowsPush())
                .mentionsEmail(preferences.getMentionsEmail())
                .mentionsPush(preferences.getMentionsPush())
                .systemEmail(preferences.getSystemEmail())
                .systemPush(preferences.getSystemPush())
                .createdAt(preferences.getCreatedAt().format(FORMATTER))
                .updatedAt(preferences.getUpdatedAt().format(FORMATTER))
                .build();
    }

    // Instance update methods (like UserMapper.updateUserFromDTO)
    public UserNotificationPreferences updateFromDTO(UserNotificationPreferences preferences, UpdateNotificationPreferencesRequestDTO dto) {
        preferences.setLikesEmail(dto.getLikesEmail());
        preferences.setLikesPush(dto.getLikesPush());
        preferences.setCommentsEmail(dto.getCommentsEmail());
        preferences.setCommentsPush(dto.getCommentsPush());
        preferences.setFollowsEmail(dto.getFollowsEmail());
        preferences.setFollowsPush(dto.getFollowsPush());
        preferences.setMentionsEmail(dto.getMentionsEmail());
        preferences.setMentionsPush(dto.getMentionsPush());
        preferences.setSystemEmail(dto.getSystemEmail());
        preferences.setSystemPush(dto.getSystemPush());
        return preferences;
    }

    public UserNotificationPreferences updateFromLikesDTO(UserNotificationPreferences preferences, UpdateLikesPreferencesRequestDTO dto) {
        preferences.setLikesEmail(dto.getLikesEmail());
        preferences.setLikesPush(dto.getLikesPush());
        return preferences;
    }

    public UserNotificationPreferences updateFromCommentsDTO(UserNotificationPreferences preferences, UpdateCommentsPreferencesRequestDTO dto) {
        preferences.setCommentsEmail(dto.getCommentsEmail());
        preferences.setCommentsPush(dto.getCommentsPush());
        return preferences;
    }

    public UserNotificationPreferences updateFromFollowsDTO(UserNotificationPreferences preferences, UpdateFollowsPreferencesRequestDTO dto) {
        preferences.setFollowsEmail(dto.getFollowsEmail());
        preferences.setFollowsPush(dto.getFollowsPush());
        return preferences;
    }

    public UserNotificationPreferences updateFromMentionsDTO(UserNotificationPreferences preferences, UpdateMentionsPreferencesRequestDTO dto) {
        preferences.setMentionsEmail(dto.getMentionsEmail());
        preferences.setMentionsPush(dto.getMentionsPush());
        return preferences;
    }

    public UserNotificationPreferences updateFromSystemDTO(UserNotificationPreferences preferences, UpdateSystemPreferencesRequestDTO dto) {
        preferences.setSystemEmail(dto.getSystemEmail());
        preferences.setSystemPush(dto.getSystemPush());
        return preferences;
    }

    public UserNotificationPreferences updateFromEmailDTO(UserNotificationPreferences preferences, UpdateEmailPreferencesRequestDTO dto) {
        preferences.setLikesEmail(dto.getLikesEmail());
        preferences.setCommentsEmail(dto.getCommentsEmail());
        preferences.setFollowsEmail(dto.getFollowsEmail());
        preferences.setMentionsEmail(dto.getMentionsEmail());
        preferences.setSystemEmail(dto.getSystemEmail());
        return preferences;
    }

    public UserNotificationPreferences updateFromPushDTO(UserNotificationPreferences preferences, UpdatePushPreferencesRequestDTO dto) {
        preferences.setLikesPush(dto.getLikesPush());
        preferences.setCommentsPush(dto.getCommentsPush());
        preferences.setFollowsPush(dto.getFollowsPush());
        preferences.setMentionsPush(dto.getMentionsPush());
        preferences.setSystemPush(dto.getSystemPush());
        return preferences;
    }

    // Utility methods for bulk operations
    public UserNotificationPreferences enableAllEmail(UserNotificationPreferences preferences) {
        preferences.setLikesEmail(true);
        preferences.setCommentsEmail(true);
        preferences.setFollowsEmail(true);
        preferences.setMentionsEmail(true);
        preferences.setSystemEmail(true);
        return preferences;
    }

    public UserNotificationPreferences disableAllEmail(UserNotificationPreferences preferences) {
        preferences.setLikesEmail(false);
        preferences.setCommentsEmail(false);
        preferences.setFollowsEmail(false);
        preferences.setMentionsEmail(false);
        preferences.setSystemEmail(false);
        return preferences;
    }

    public UserNotificationPreferences enableAllPush(UserNotificationPreferences preferences) {
        preferences.setLikesPush(true);
        preferences.setCommentsPush(true);
        preferences.setFollowsPush(true);
        preferences.setMentionsPush(true);
        preferences.setSystemPush(true);
        return preferences;
    }

    public UserNotificationPreferences disableAllPush(UserNotificationPreferences preferences) {
        preferences.setLikesPush(false);
        preferences.setCommentsPush(false);
        preferences.setFollowsPush(false);
        preferences.setMentionsPush(false);
        preferences.setSystemPush(false);
        return preferences;
    }

    public UserNotificationPreferences resetToDefaults(UserNotificationPreferences preferences) {
        preferences.setLikesEmail(true);
        preferences.setLikesPush(true);
        preferences.setCommentsEmail(true);
        preferences.setCommentsPush(true);
        preferences.setFollowsEmail(true);
        preferences.setFollowsPush(true);
        preferences.setMentionsEmail(true);
        preferences.setMentionsPush(true);
        preferences.setSystemEmail(true);
        preferences.setSystemPush(true);
        return preferences;
    }
}
