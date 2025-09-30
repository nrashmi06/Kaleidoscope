package com.kaleidoscope.backend.blogs.dto.response;

import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import com.kaleidoscope.backend.shared.dto.response.CategorySummaryResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

;

@Data
@Builder
public class BlogSummaryResponseDTO {
    private Long blogId;
    private String title;
    private String summary;
    private LocalDateTime createdAt;
    private UserDetailsSummaryResponseDTO author;
    private List<CategorySummaryResponseDTO> categories;
    private String thumbnailUrl;

    private long reactionCount;
    private long commentCount;
    private BlogStatus blogStatus;
}
