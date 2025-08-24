package com.kaleidoscope.backend.posts.dto.response;

import com.kaleidoscope.backend.shared.enums.MediaType;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

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
    private java.util.Map<String, Object> extraMetadata;
    private java.time.LocalDateTime createdAt;
}
