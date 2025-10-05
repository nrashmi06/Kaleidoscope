package com.kaleidoscope.backend.async.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostImageEventDTO {
    private Long postId;
    private Long mediaId;
    private String imageUrl;
    private String correlationId;
}
