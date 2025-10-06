package com.kaleidoscope.backend.shared.dto.request;

import com.kaleidoscope.backend.shared.enums.ContentType;
import jakarta.validation.constraints.NotNull;

public record CreateUserTagRequestDTO(
    @NotNull(message = "Tagged user ID is required")
    Long taggedUserId,

    @NotNull(message = "Content type is required")
    ContentType contentType,

    @NotNull(message = "Content ID is required")
    Long contentId
) {
}
