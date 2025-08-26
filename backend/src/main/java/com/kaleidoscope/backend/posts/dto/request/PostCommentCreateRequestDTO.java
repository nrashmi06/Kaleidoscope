package com.kaleidoscope.backend.posts.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PostCommentCreateRequestDTO {
    @NotBlank
    private String body;
}


