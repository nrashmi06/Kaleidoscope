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

    public UserNotificationPreferences updateFromDTO(UserNotificationPreferences preferences, UpdateNotificationPreferencesRequestDTO dto) {
        preferences.setLikesEmail(dto.likesEmail());
        preferences.setLikesPush(dto.likesPush());
        preferences.setCommentsEmail(dto.commentsEmail());
        preferences.setCommentsPush(dto.commentsPush());
        preferences.setFollowsEmail(dto.followsEmail());
        preferences.setFollowsPush(dto.followsPush());
        preferences.setMentionsEmail(dto.mentionsEmail());
        preferences.setMentionsPush(dto.mentionsPush());
        preferences.setSystemEmail(dto.systemEmail());
        preferences.setSystemPush(dto.systemPush());
        return preferences;
    }

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
