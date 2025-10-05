package com.kaleidoscope.backend.users.dto.request;

import com.kaleidoscope.backend.users.enums.Visibility;
import jakarta.validation.constraints.NotNull;

public record UpdateVisibilitySettingsRequestDTO(
    @NotNull(message = "Profile visibility is required")
    Visibility profileVisibility,

    @NotNull(message = "Allow messages setting is required")
    Visibility allowMessages,

    @NotNull(message = "Allow tagging setting is required")
    Visibility allowTagging,

    @NotNull(message = "View activity setting is required")
    Visibility viewActivity
) {
}
