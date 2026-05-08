package com.kaleidoscope.backend.async.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognitionResultDTO {

    private Long mediaId;
    private Long postId;

    // IMPORTANT: can be UUID string from AI matcher
    private String faceId;

    private Long suggestedUserId;
    private String matchedUsername;
    private Double confidenceScore;
    private String correlationId;
}
