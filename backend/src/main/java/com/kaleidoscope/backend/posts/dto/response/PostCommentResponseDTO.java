package com.kaleidoscope.backend.posts.dto.response;

import com.kaleidoscope.backend.posts.enums.CommentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PostCommentResponseDTO {
    private Long commentId;
    private Long postId;
    private String body;
    private CommentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UserResponseDTO author;
}


