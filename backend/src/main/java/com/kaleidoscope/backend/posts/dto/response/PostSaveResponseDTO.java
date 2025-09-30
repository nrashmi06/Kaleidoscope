package com.kaleidoscope.backend.posts.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PostSaveResponseDTO {
    private boolean saved;
    private long totalSaves;
    private LocalDateTime savedAt;
}
