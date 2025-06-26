package com.kaleidoscope.backend.users.dto.request;

import com.kaleidoscope.backend.users.enums.Theme;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateThemeRequestDTO {

    @NotNull(message = "Theme is required")
    private Theme theme;
}
