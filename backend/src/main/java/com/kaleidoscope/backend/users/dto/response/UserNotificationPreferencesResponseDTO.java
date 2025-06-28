package com.kaleidoscope.backend.users.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationPreferencesResponseDTO {

    private Long preferenceId;
    private Long userId;
    private Boolean likesEmail;
    private Boolean likesPush;
    private Boolean commentsEmail;
    private Boolean commentsPush;
    private Boolean followsEmail;
    private Boolean followsPush;
    private Boolean mentionsEmail;
    private Boolean mentionsPush;
    private Boolean systemEmail;
    private Boolean systemPush;
    private String createdAt;
    private String updatedAt;
}
