package com.kaleidoscope.backend.users.dto.request;

import com.kaleidoscope.backend.users.enums.Theme;
import jakarta.validation.constraints.NotNull;

public record UpdateThemeRequestDTO(
    @NotNull(message = "Theme is required")
    Theme theme
) {
}
