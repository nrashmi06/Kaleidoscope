package com.kaleidoscope.backend.posts.dto.response;

import com.kaleidoscope.backend.posts.enums.PostVisibility;
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
    private UserSummaryResponseDTO author;
    private List<CategoryResponseDTO> categories;
    private String thumbnailUrl;

    // Interaction Counts
    private long reactionCount;
    private long commentCount;
}