package com.kaleidoscope.backend.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CategoryResponseDTO {
    private Long categoryId;
    private String name;
    private String description;
    private String iconName;
    private Long parentId;
    private Set<CategoryResponseDTO> subcategories;
}