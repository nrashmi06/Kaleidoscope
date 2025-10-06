package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AddUserInterestRequestDTO(
    @NotNull(message = "Category ID is required")
    @Positive(message = "Category ID must be positive")
    Long categoryId
) {
}
