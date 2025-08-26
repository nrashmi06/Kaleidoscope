package com.kaleidoscope.backend.posts.dto.request;

import com.kaleidoscope.backend.posts.enums.ReactionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReactionRequestDTO {
    @NotNull
    private ReactionType reactionType;
}


