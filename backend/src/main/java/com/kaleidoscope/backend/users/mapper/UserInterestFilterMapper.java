package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.model.UserInterest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserInterestFilterMapper {

    /**
     * Filter out child category interests when their parent category is already in user's interests
     * This prevents redundancy in the response
     */
    public List<UserInterest> filterRedundantChildInterests(List<UserInterest> userInterests) {
        // Get all category IDs that user has interests in
        Set<Long> userCategoryIds = userInterests.stream()
                .map(interest -> interest.getCategory().getCategoryId())
                .collect(Collectors.toSet());

        // Filter out interests where the category's parent is also in user's interests
        return userInterests.stream()
                .filter(interest -> {
                    Long parentId = interest.getCategory().getParent() != null
                            ? interest.getCategory().getParent().getCategoryId()
                            : null;

                    // Keep the interest if:
                    // 1. It's a root category (parentId is null), OR
                    // 2. Its parent is NOT in user's interests
                    return parentId == null || !userCategoryIds.contains(parentId);
                })
                .toList();
    }

    /**
     * Extract category IDs from user interests for efficient lookup operations
     */
    public Set<Long> extractCategoryIds(List<UserInterest> userInterests) {
        return userInterests.stream()
                .map(userInterest -> userInterest.getCategory().getCategoryId())
                .collect(Collectors.toSet());
    }

    /**
     * Filter out category IDs that already exist in user's interests
     */
    public List<Long> filterNewCategoryIds(List<Long> categoryIds, Set<Long> existingInterests) {
        return categoryIds.stream()
                .filter(categoryId -> !existingInterests.contains(categoryId))
                .toList();
    }

    /**
     * Find missing category IDs from a map of available categories
     */
    public List<Long> findMissingCategoryIds(List<Long> requestedIds, Set<Long> availableIds) {
        return requestedIds.stream()
                .filter(id -> !availableIds.contains(id))
                .toList();
    }
}
