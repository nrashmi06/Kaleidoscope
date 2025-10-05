package com.kaleidoscope.backend.posts.dto.request;

import com.kaleidoscope.backend.shared.enums.MediaType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.util.Map;

@Data
public class MediaUploadRequestDTO {
    private Long mediaId;
    @URL
    private String url;
    @NotNull
    private MediaType mediaType;
    private Integer position;
    private Integer width;
    private Integer height;
    private Integer fileSizeKb;
    private Integer durationSeconds;
    private Map<String, Object> extraMetadata;
}
