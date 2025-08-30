package com.kaleidoscope.backend.posts.dto.response;

import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.shared.dto.response.CategorySummaryResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostDetailResponseDTO {
    // Core Post Details
    private Long postId;
    private String title;
    private String body;
    private String summary;
    private PostVisibility visibility;
    private PostStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Relational Details
    private UserSummaryResponseDTO author;
    private List<CategorySummaryResponseDTO> categories;
    private List<PostMediaResponseDTO> media;
    private LocationResponseDTO location;
    private List<UserTagResponseDTO> taggedUsers;

    // Interaction Counts & User-Specific Reaction
    private long reactionCount;
    private long commentCount;
    private ReactionType currentUserReaction;
}