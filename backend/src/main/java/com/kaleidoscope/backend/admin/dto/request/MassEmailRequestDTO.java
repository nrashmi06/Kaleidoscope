package com.kaleidoscope.backend.admin.dto.request;

import com.kaleidoscope.backend.shared.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record MassEmailRequestDTO(
    @NotBlank(message = "Subject is required")
    String subject,

    @NotBlank(message = "Body is required")
    String body,

    @NotEmpty(message = "At least one target role is required")
    List<Role> targetRoles
) {
}
