package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdateNotificationPreferencesRequestDTO(
    @NotNull(message = "Likes email preference is required")
    Boolean likesEmail,

    @NotNull(message = "Likes push preference is required")
    Boolean likesPush,

    @NotNull(message = "Comments email preference is required")
    Boolean commentsEmail,

    @NotNull(message = "Comments push preference is required")
    Boolean commentsPush,

    @NotNull(message = "Follows email preference is required")
    Boolean followsEmail,

    @NotNull(message = "Follows push preference is required")
    Boolean followsPush,

    @NotNull(message = "Mentions email preference is required")
    Boolean mentionsEmail,

    @NotNull(message = "Mentions push preference is required")
    Boolean mentionsPush,

    @NotNull(message = "System email preference is required")
    Boolean systemEmail,

    @NotNull(message = "System push preference is required")
    Boolean systemPush
) {
}
