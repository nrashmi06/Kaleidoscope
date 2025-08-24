package com.kaleidoscope.backend.posts.dto.response;

import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

// Main Response DTO
@Data
@Builder
public class PostResponseDTO {
    private Long postId;
    private String title;
    private String body;
    private String summary;
    private Integer wordCount;
    private Integer readTimeMinutes;
    private PostVisibility visibility;
    private PostStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UserResponseDTO author;
    private List<CategoryResponseDTO> categories;
    private List<PostMediaResponseDTO> media;
    private LocationResponseDTO location;
}