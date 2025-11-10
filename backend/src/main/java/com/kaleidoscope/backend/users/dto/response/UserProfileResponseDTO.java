package com.kaleidoscope.backend.users.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.users.enums.FollowStatus;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // Hide null fields (like posts, if private)
public record UserProfileResponseDTO(
    Long userId,
    String username,
    String profilePictureUrl,
    String coverPhotoUrl,
    String summary,
    String designation,
    
    // Counts (from UserDocument)
    int followerCount,
    int followingCount,

    // Status from the viewer's perspective
    boolean isPrivate,
    FollowStatus followStatus,

    // The user's posts (will be null if profile is private and not followed)
    PaginatedResponse<PostSummaryResponseDTO> posts
) {}
