package com.kaleidoscope.backend.notifications.mapper;

import com.kaleidoscope.backend.notifications.dto.response.NotificationResponseDTO;
import com.kaleidoscope.backend.notifications.model.Notification;
import com.kaleidoscope.backend.users.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationMapper {

    public NotificationResponseDTO toResponseDTO(Notification notification) {
        if (notification == null) {
            return null;
        }

        NotificationResponseDTO.NotificationResponseDTOBuilder builder = NotificationResponseDTO.builder()
                .notificationId(notification.getNotificationId())
                .type(notification.getType() != null ? notification.getType().name() : null)
                .message(notification.getMessage())
                .link(notification.getLink())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .contentId(notification.getContentId())
                .contentType(notification.getContentType() != null ? notification.getContentType().name() : null);

        // Map actor user details if present
        User actorUser = notification.getActorUser();
        if (actorUser != null) {
            builder.actorUserId(actorUser.getUserId())
                   .actorUsername(actorUser.getUsername())
                   .actorProfilePictureUrl(actorUser.getProfilePictureUrl());
        }

        return builder.build();
    }
}
