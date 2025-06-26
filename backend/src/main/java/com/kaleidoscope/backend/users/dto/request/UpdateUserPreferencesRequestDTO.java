package com.kaleidoscope.backend.users.dto.request;

import com.kaleidoscope.backend.users.enums.Theme;
import com.kaleidoscope.backend.users.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserPreferencesRequestDTO {

    @NotNull(message = "Theme is required")
    private Theme theme;

    @NotBlank(message = "Language is required")
    @Pattern(regexp = "^[a-z]{2}-[A-Z]{2}$", message = "Language must be in format: en-US")
    private String language;

    @NotNull(message = "Profile visibility is required")
    private Visibility profileVisibility;

    @NotNull(message = "Allow messages setting is required")
    private Visibility allowMessages;

    @NotNull(message = "Allow tagging setting is required")
    private Visibility allowTagging;

    @NotNull(message = "View activity setting is required")
    private Visibility viewActivity;

    @NotNull(message = "Show email setting is required")
    private Boolean showEmail;

    @NotNull(message = "Show phone setting is required")
    private Boolean showPhone;

    @NotNull(message = "Show online status setting is required")
    private Boolean showOnlineStatus;

    @NotNull(message = "Search discoverable setting is required")
    private Boolean searchDiscoverable;
}
