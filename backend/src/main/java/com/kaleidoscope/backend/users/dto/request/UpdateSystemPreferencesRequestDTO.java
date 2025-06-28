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
public class UpdateSystemPreferencesRequestDTO {

    @NotNull(message = "System email preference is required")
    private Boolean systemEmail;

    @NotNull(message = "System push preference is required")
    private Boolean systemPush;
}
