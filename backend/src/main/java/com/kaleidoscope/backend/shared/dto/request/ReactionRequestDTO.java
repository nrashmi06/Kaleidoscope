package com.kaleidoscope.backend.shared.dto.request;

import com.kaleidoscope.backend.shared.enums.ReactionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReactionRequestDTO {
    @NotNull
    private ReactionType reactionType;
}


