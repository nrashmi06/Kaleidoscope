package com.kaleidoscope.backend.ml.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class MediaAiInsightsResultDTO {
    private Long mediaId;
    private Boolean isSafe;
    private String caption;
    private List<String> tags;
    private List<String> scenes;
    private String imageEmbedding;
}
