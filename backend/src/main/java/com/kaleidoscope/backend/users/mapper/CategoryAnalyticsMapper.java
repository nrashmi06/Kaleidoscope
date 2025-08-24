package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.users.dto.response.CategoryAnalyticsResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class CategoryAnalyticsMapper {

    public CategoryAnalyticsResponseDTO.CategoryStats toCategoryStats(Category category, Long userCount, Long totalUsers) {
        // Calculate percentage (avoiding division by zero)
        double percentage = totalUsers > 0 ? (userCount * 100.0) / totalUsers : 0.0;
        percentage = Math.round(percentage * 100.0) / 100.0; // Round to 2 decimal places

        return CategoryAnalyticsResponseDTO.CategoryStats.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getName())
                .userCount(userCount)
                .percentage(percentage)
                .build();
    }

    public Page<CategoryAnalyticsResponseDTO.CategoryStats> buildCategoryStatsPage(
            Page<Category> categoryPage,
            Map<Long, Long> userCountMap,
            Long totalUsers) {
        return categoryPage.map(category -> {
            Long userCount = userCountMap.getOrDefault(category.getCategoryId(), 0L);
            return toCategoryStats(category, userCount, totalUsers);
        });
    }

    public CategoryAnalyticsResponseDTO toCategoryAnalyticsResponse(
            Page<CategoryAnalyticsResponseDTO.CategoryStats> categoryStatsPage,
            Long totalUsers,
            Long totalCategories) {
        return CategoryAnalyticsResponseDTO.builder()
                .categoryStats(categoryStatsPage)
                .totalUsers(totalUsers)
                .totalCategories(totalCategories)
                .build();
    }
}
