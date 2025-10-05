package com.kaleidoscope.backend.shared.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.Set;

public record CommentCreateRequestDTO(
    @NotBlank
    String body,

    Set<Long> taggedUserIds
) {
}
