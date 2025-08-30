package com.kaleidoscope.backend.shared.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentCreateRequestDTO {
    @NotBlank
    private String body;
}


