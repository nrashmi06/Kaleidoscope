package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotNull;

public record BlockUserRequestDTO(
    @NotNull(message = "User ID to block is required")
    Long userIdToBlock,

    String reason // Optional reason for blocking
) {
}
