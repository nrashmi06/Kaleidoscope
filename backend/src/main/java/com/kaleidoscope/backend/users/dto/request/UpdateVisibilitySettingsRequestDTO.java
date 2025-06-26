package com.kaleidoscope.backend.users.dto.request;

import com.kaleidoscope.backend.users.enums.Visibility;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateVisibilitySettingsRequestDTO {

    @NotNull(message = "Profile visibility is required")
    private Visibility profileVisibility;

    @NotNull(message = "Allow messages setting is required")
    private Visibility allowMessages;

    @NotNull(message = "Allow tagging setting is required")
    private Visibility allowTagging;

    @NotNull(message = "View activity setting is required")
    private Visibility viewActivity;
}
