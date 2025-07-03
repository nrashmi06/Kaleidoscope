package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserInterest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class UserInterestBulkOperationsMapper {

    /**
     * Build user interests from category IDs using pre-fetched entities
     */
    public List<UserInterest> buildUserInterests(List<Long> categoryIds, User user, Map<Long, Category> categoryMap) {
        return categoryIds.stream()
                .map(categoryId -> UserInterest.builder()
                        .user(user)
                        .category(categoryMap.get(categoryId))
                        .build())
                .toList();
    }

    /**
     * Validate that all requested categories exist and throw exception if any are missing
     */
    public void validateCategoriesExist(List<Long> requestedCategoryIds, Map<Long, Category> categoryMap) {
        List<Long> missingCategoryIds = requestedCategoryIds.stream()
                .filter(id -> !categoryMap.containsKey(id))
                .toList();

        if (!missingCategoryIds.isEmpty()) {
            throw new IllegalArgumentException("Categories not found: " + missingCategoryIds);
        }
    }

    /**
     * Extract category IDs from a list of categories for efficient lookup
     */
    public List<Long> extractCategoryIds(List<Category> categories) {
        return categories.stream()
                .map(Category::getCategoryId)
                .toList();
    }
}
