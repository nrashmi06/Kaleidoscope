package com.kaleidoscope.backend.shared.dto.request;

import com.kaleidoscope.backend.shared.enums.ReactionType;
import jakarta.validation.constraints.NotNull;

public record ReactionRequestDTO(
    @NotNull
    ReactionType reactionType
) {
}
