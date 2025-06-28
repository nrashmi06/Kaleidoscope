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
public class UpdateEmailPreferencesRequestDTO {

    @NotNull(message = "Likes email preference is required")
    private Boolean likesEmail;

    @NotNull(message = "Comments email preference is required")
    private Boolean commentsEmail;

    @NotNull(message = "Follows email preference is required")
    private Boolean followsEmail;

    @NotNull(message = "Mentions email preference is required")
    private Boolean mentionsEmail;

    @NotNull(message = "System email preference is required")
    private Boolean systemEmail;
}
