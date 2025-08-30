package com.kaleidoscope.backend.blogs.dto.request;

import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
public class BlogCreateRequestDTO {
    @NotBlank
    @Size(max = 200)
    private String title;

    @NotBlank
    private String body;

    @Size(max = 500)
    private String summary;

    private List<MediaUploadRequestDTO> mediaDetails;

    private Long locationId;

    @NotEmpty
    private Set<Long> categoryIds;

    private List<Long> blogTagIds;
}
