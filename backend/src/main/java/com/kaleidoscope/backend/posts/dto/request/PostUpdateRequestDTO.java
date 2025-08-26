package com.kaleidoscope.backend.posts.dto.request;

import com.kaleidoscope.backend.posts.enums.PostType;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
public class PostUpdateRequestDTO {
    @NotBlank
    @Size(max = 200)
    private String title;

    @NotNull
    private String body;

    @Size(max = 500)
    private String summary;

    private List<MediaUploadRequestDTO> mediaDetails;

    @NotNull
    private PostVisibility visibility;

    private Long locationId;

    @NotEmpty
    private Set<Long> categoryIds;

    private PostType type;
}

