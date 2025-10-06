package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdatePrivacySettingsRequestDTO(
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
