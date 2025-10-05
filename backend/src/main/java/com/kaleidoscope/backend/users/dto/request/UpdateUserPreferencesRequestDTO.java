package com.kaleidoscope.backend.users.dto.request;

import com.kaleidoscope.backend.users.enums.Theme;
import com.kaleidoscope.backend.users.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record UpdateUserPreferencesRequestDTO(
    @NotNull(message = "Theme is required")
    Theme theme,

    @NotBlank(message = "Language is required")
    @Pattern(regexp = "^[a-z]{2}-[A-Z]{2}$", message = "Language must be in format: en-US")
    String language,

    @NotNull(message = "Profile visibility is required")
    Visibility profileVisibility,

    @NotNull(message = "Allow messages setting is required")
    Visibility allowMessages,

    @NotNull(message = "Allow tagging setting is required")
    Visibility allowTagging,

    @NotNull(message = "View activity setting is required")
    Visibility viewActivity,

    @NotNull(message = "Show email setting is required")
    Boolean showEmail,

    @NotNull(message = "Show phone setting is required")
    Boolean showPhone,

    @NotNull(message = "Show online status setting is required")
    Boolean showOnlineStatus,

    @NotNull(message = "Search discoverable setting is required")
    Boolean searchDiscoverable
) {
}
