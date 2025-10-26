
package com.kaleidoscope.backend.notifications.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    private Long notificationId;
    private String type;
    private String message;
    private String link;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private Long actorUserId;
    private String actorUsername;
    private String actorProfilePictureUrl;
    private Long contentId;
    private String contentType;
}

