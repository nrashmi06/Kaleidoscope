package com.kaleidoscope.backend.posts.dto.response;

import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.shared.dto.response.CategorySummaryResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostSummaryResponseDTO {
    private Long postId;
    private String title;
    private String summary;
    private PostVisibility visibility;
    private LocalDateTime createdAt;
    private UserDetailsSummaryResponseDTO author;
    private List<CategorySummaryResponseDTO> categories;
    private String thumbnailUrl;
    private List<String> hashtags;

    // Interaction Counts
    private long reactionCount;
    private long commentCount;
    private long viewCount;
}