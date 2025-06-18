package com.kaleidoscope.backend.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CategoryParentResponseDTO {
    private Long categoryId;
    private String name;
    private String description;
    private String iconName;
    private Long parentId;
}