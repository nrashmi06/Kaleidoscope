package com.kaleidoscope.backend.async.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FaceRecognitionResultDTO {
    private Long faceId;
    private Long suggestedUserId;
    private Double confidenceScore;
}
