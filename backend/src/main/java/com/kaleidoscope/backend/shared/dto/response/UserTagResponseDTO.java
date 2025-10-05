package com.kaleidoscope.backend.shared.dto.response;

import com.kaleidoscope.backend.shared.enums.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTagResponseDTO {
    private Long tagId;
    private Long taggedUserId;
    private String taggedUsername;
    private Long taggerUserId;
    private String taggerUsername;
    private ContentType contentType;
    private Long contentId;
    private LocalDateTime createdAt;
}
