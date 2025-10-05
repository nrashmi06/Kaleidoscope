package com.kaleidoscope.backend.users.dto.request;

public record PartialUpdateNotificationPreferencesRequestDTO(
    Boolean likesEmail,
    Boolean likesPush,
    Boolean commentsEmail,
    Boolean commentsPush,
    Boolean followsEmail,
    Boolean followsPush,
    Boolean mentionsEmail,
    Boolean mentionsPush,
    Boolean systemEmail,
    Boolean systemPush
) {
}
