package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotNull;

public record UnblockUserRequestDTO(
    @NotNull(message = "User ID to unblock is required")
    Long userIdToUnblock
) {
}
