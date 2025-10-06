package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateLanguageRequestDTO(
    @NotBlank(message = "Language is required")
    @Pattern(regexp = "^[a-z]{2}-[A-Z]{2}$", message = "Language must be in format: en-US")
    String language
) {
}
