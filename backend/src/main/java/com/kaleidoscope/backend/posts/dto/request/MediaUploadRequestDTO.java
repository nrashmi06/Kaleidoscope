package com.kaleidoscope.backend.posts.dto.request;

import com.kaleidoscope.backend.shared.enums.MediaType;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.URL;

import java.util.Map;

public record MediaUploadRequestDTO(
    Long mediaId,
    @URL
    String url,
    @NotNull
    MediaType mediaType,
    Integer position,
    Integer width,
    Integer height,
    Integer fileSizeKb,
    Integer durationSeconds,
    Map<String, Object> extraMetadata
) {
}
