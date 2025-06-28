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
public class UpdatePushPreferencesRequestDTO {

    @NotNull(message = "Likes push preference is required")
    private Boolean likesPush;

    @NotNull(message = "Comments push preference is required")
    private Boolean commentsPush;

    @NotNull(message = "Follows push preference is required")
    private Boolean followsPush;

    @NotNull(message = "Mentions push preference is required")
    private Boolean mentionsPush;

    @NotNull(message = "System push preference is required")
    private Boolean systemPush;
}
