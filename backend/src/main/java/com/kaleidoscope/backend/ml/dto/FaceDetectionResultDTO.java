package com.kaleidoscope.backend.ml.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class FaceDetectionResultDTO {
    private Long mediaId;
    private List<Integer> bbox;
    private String embedding;
}
