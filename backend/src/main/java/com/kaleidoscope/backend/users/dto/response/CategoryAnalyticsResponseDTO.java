package com.kaleidoscope.backend.users.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryAnalyticsResponseDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryStats {
        private Long categoryId;
        private String categoryName;
        private Long userCount;
        private Double percentage;
    }

    private org.springframework.data.domain.Page<CategoryStats> categoryStats;
    private Long totalUsers;
    private Long totalCategories;
}
