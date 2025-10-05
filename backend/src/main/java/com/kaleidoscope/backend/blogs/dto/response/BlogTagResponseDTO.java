package com.kaleidoscope.backend.blogs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogTagResponseDTO {
    private Long blogId;
    private String title;
}

