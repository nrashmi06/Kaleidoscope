package com.kaleidoscope.backend.async.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostImageEventDTO {
    private Long postId;
    private Long mediaId;
    private String mediaUrl;
    private Long uploaderId;
    private String timestamp;
    private String correlationId;
}
