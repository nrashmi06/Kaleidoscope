package com.kaleidoscope.backend.blogs.dto.request;

import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(
    description = "Request DTO for updating blog status by administrators",
    example = """
    {
      "status": "APPROVED",
      "reviewerComment": "Content reviewed and approved for publication"
    }
    """
)
public class BlogStatusUpdateRequestDTO {

    @NotNull(message = "Blog status is required")
    @Schema(
        description = "New status to set for the blog. Must be one of the valid BlogStatus enum values.",
        example = "APPROVED",
        allowableValues = {"DRAFT", "APPROVAL_PENDING", "APPROVED", "FLAGGED", "ARCHIVED", "REJECTED", "PUBLISHED"},
        required = true
    )
    private BlogStatus status;
    
    @Schema(
        description = "Optional comment from the reviewer explaining the status change decision",
        example = "Content reviewed and approved for publication",
        maxLength = 500
    )
    private String reviewerComment;
}
