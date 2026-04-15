package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserProfileStatusRequestDTO(
    @NotNull(message = "userId is required")
    Long userId,
    @NotBlank(message = "profileStatus is required")
    String profileStatus
) {
}
