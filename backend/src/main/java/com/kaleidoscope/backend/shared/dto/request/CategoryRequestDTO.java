package com.kaleidoscope.backend.shared.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequestDTO(
    @NotBlank(message = "Category name cannot be blank")
    @Size(min = 2, max = 50, message = "Category name must be between 2 and 50 characters")
    String name,

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    String description,

    @Size(max = 50, message = "Icon name cannot exceed 50 characters")
    String iconName,

    // Optional parent category ID for hierarchical structure
    Long parentId
) {
}
