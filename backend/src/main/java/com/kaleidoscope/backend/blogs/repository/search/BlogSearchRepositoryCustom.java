package com.kaleidoscope.backend.blogs.repository.search;

import com.kaleidoscope.backend.blogs.document.BlogDocument;
import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Custom repository for complex BlogDocument search operations.
 * Mirrors PostSearchRepositoryCustom simplified for Blog security model.
 */
public interface BlogSearchRepositoryCustom {
    Page<BlogDocument> findVisibleAndFilteredBlogs(
            Long currentUserId,
            boolean isAdmin,
            Long authorUserId,
            Long categoryId,
            BlogStatus status,
            String query,
            Long locationId,
            Pageable pageable,
            Double latitude,
            Double longitude,
            Double radiusKm,
            Long minReactions,
            Long minComments,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    Page<BlogDocument> findBlogsThatTag(
            Long taggedBlogId,
            Long currentUserId,
            boolean isAdmin,
            Pageable pageable
    );

    Page<BlogDocument> findBlogSuggestions(
            Long currentUserId,
            Set<Long> followingIds,
            List<Long> interestIds,
            List<Long> blockedUserIds,
            List<Long> blockedByUserIds,
            Set<String> viewedBlogIds,
            List<Long> socialContextBlogIds,
            Pageable pageable
    );

    List<Long> findBlogsThatTagAny(Set<Long> taggedBlogIds);
}

