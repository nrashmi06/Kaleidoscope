package com.kaleidoscope.backend.shared.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorySummaryResponseDTO {
    private Long categoryId;
    private String name;
}

