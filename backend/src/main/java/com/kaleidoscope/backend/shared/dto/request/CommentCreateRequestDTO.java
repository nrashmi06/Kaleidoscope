package com.kaleidoscope.backend.shared.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Set;

@Data
public class CommentCreateRequestDTO {
    @NotBlank
    private String body;

    private Set<Long> taggedUserIds;
}


