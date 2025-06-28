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
public class UpdateMentionsPreferencesRequestDTO {

    @NotNull(message = "Mentions email preference is required")
    private Boolean mentionsEmail;

    @NotNull(message = "Mentions push preference is required")
    private Boolean mentionsPush;
}
