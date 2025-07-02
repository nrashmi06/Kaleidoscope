package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.users.dto.response.CategoryAnalyticsResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
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

    public CategoryAnalyticsResponseDTO toCategoryAnalyticsResponse(
            List<CategoryAnalyticsResponseDTO.CategoryStats> categoryStats,
            Long totalUsers,
            Long totalCategories,
            Page<Category> categoryPage,
            Pageable pageable) {

        return CategoryAnalyticsResponseDTO.builder()
                .categoryStats(categoryStats)
                .totalUsers(totalUsers)
                .totalCategories(totalCategories)
                .currentPage(pageable.getPageNumber())
                .totalPages(categoryPage.getTotalPages())
                .totalElements(categoryPage.getTotalElements())
                .build();
    }

    public List<CategoryAnalyticsResponseDTO.CategoryStats> buildCategoryStatsList(
            Page<Category> categoryPage,
            Map<Long, Long> userCountMap,
            Long totalUsers) {

        return categoryPage.getContent().stream()
                .map(category -> {
                    Long userCount = userCountMap.getOrDefault(category.getCategoryId(), 0L);
                    return toCategoryStats(category, userCount, totalUsers);
                })
                .sorted((a, b) -> Long.compare(b.getUserCount(), a.getUserCount())) // Sort by user count descending
                .toList();
    }
}
