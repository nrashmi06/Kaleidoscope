package com.kaleidoscope.backend.blogs.dto.request;

import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Set;

public record BlogUpdateRequestDTO(
    @NotBlank
    @Size(max = 200)
    String title,

    @NotBlank
    String body,

    @Size(max = 500)
    String summary,

    List<MediaUploadRequestDTO> mediaDetails,

    Long locationId,

    @NotEmpty
    Set<Long> categoryIds,

    List<Long> blogTagIds
) {
}
