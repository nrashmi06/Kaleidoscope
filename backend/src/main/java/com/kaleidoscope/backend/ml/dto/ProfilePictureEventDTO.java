package com.kaleidoscope.backend.ml.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfilePictureEventDTO {
    private Long userId;
    private String imageUrl;
    private String correlationId;
}
