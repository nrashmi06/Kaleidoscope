package com.kaleidoscope.backend.async.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostImageEventDTO {
    private Long postId;
    private Long mediaId;
    private String mediaUrl; // RENAMED from imageUrl
    private Long uploaderId; // ADDED
    private String timestamp; // ADDED
    private String correlationId; // KEPT for log tracking
}
