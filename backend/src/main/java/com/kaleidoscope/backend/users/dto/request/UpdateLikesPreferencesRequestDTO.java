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
public class UpdateLikesPreferencesRequestDTO {

    @NotNull(message = "Likes email preference is required")
    private Boolean likesEmail;

    @NotNull(message = "Likes push preference is required")
    private Boolean likesPush;
}
