package com.kaleidoscope.backend.posts.dto.response;

import com.kaleidoscope.backend.shared.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostMediaResponseDTO {
    private Long mediaId;
    private String mediaUrl;
    private MediaType mediaType;
    private Integer position;
    private Integer width;
    private Integer height;
    private Integer fileSizeKb;
    private Integer durationSeconds;
    private Map<String, Object> extraMetadata;
    private LocalDateTime createdAt;
}
