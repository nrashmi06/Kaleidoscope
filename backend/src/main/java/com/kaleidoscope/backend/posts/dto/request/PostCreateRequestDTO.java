package com.kaleidoscope.backend.posts.dto.request;

import com.kaleidoscope.backend.posts.enums.PostVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Set;

public record PostCreateRequestDTO(
    @NotBlank
    @Size(max = 200)
    String title,

    @NotNull
    String body,

    @Size(max = 500)
    String summary,

    List<MediaUploadRequestDTO> mediaDetails,

    @NotNull
    PostVisibility visibility,

    Long locationId,

    @NotEmpty
    Set<Long> categoryIds,

    Set<Long> taggedUserIds
) {
}