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
public class UpdateFollowsPreferencesRequestDTO {

    @NotNull(message = "Follows email preference is required")
    private Boolean followsEmail;

    @NotNull(message = "Follows push preference is required")
    private Boolean followsPush;
}
