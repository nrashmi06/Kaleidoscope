package com.kaleidoscope.backend.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CategoryListResponseDTO {
    private List<CategoryResponseDTO> categories;
    private int totalCategories;
}
