package com.kaleidoscope.backend.blogs.dto.response;

import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.shared.dto.response.CategorySummaryResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.UserSummaryResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogDetailResponseDTO {
    private Long blogId;
    private String title;
    private String body;
    private String summary;
    private Integer wordCount;
    private Integer readTimeMinutes;
    private BlogStatus blogStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime reviewedAt;
    private UserSummaryResponseDTO author;
    private UserSummaryResponseDTO reviewer;
    private List<CategorySummaryResponseDTO> categories;
    private List<BlogMediaResponseDTO> media;
    private LocationResponseDTO location;
    private long reactionCount;
    private long commentCount;
    private List<BlogTagResponseDTO> tags;
    private ReactionType currentUserReaction;
}
