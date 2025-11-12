package com.kaleidoscope.backend.async.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceDetectionResultDTO {

    private Long mediaId;
    private Long postId;
    private Integer facesDetected;
    private List<FaceDetails> faces;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FaceDetails {
        private String faceId;
        private Double confidence;
        private List<Double> bbox;
        private String embedding;
    }
}
