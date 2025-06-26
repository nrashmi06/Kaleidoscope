package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePrivacySettingsRequestDTO {

    @NotNull(message = "Show email setting is required")
    private Boolean showEmail;

    @NotNull(message = "Show phone setting is required")
    private Boolean showPhone;

    @NotNull(message = "Show online status setting is required")
    private Boolean showOnlineStatus;

    @NotNull(message = "Search discoverable setting is required")
    private Boolean searchDiscoverable;
}
