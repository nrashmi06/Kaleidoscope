package com.kaleidoscope.backend.shared.dto.response;

import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.shared.enums.CommentStatus;
import com.kaleidoscope.backend.shared.enums.ContentType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class CommentResponseDTO {
    private Long commentId;
    private Long contentId; // Changed from postId
    private ContentType contentType; // Added contentType
    private String body;
    private CommentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UserDetailsSummaryResponseDTO author;
    private Set<UserTagResponseDTO> tags;
}