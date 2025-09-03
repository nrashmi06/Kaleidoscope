package com.kaleidoscope.backend.blogs.dto.request;

import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BlogStatusUpdateRequestDTO {
    @NotNull(message = "Blog status is required")
    private BlogStatus status;
    
    private String reviewerComment;
}
