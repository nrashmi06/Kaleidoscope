package com.kaleidoscope.backend.async.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO for parsing the 'post-insights-enriched' message from the AI Post Aggregator.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PostInsightsEnrichedDTO {
    private Long postId;
    private List<String> allAiTags;
    private List<String> allAiScenes;
    private String inferredEventType;
    private List<String> inferredTags;
    private String timestamp;
    private String correlationId; // Added to receive from the message
}

