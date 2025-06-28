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
public class UpdateCommentsPreferencesRequestDTO {

    @NotNull(message = "Comments email preference is required")
    private Boolean commentsEmail;

    @NotNull(message = "Comments push preference is required")
    private Boolean commentsPush;
}
