package com.kaleidoscope.backend.users.dto.request;

import lombok.Data;

@Data
public class PartialUpdateNotificationPreferencesRequestDTO {
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
}


