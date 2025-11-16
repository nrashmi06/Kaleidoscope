package com.kaleidoscope.backend.blogs.repository.search;

import com.kaleidoscope.backend.blogs.document.BlogDocument;
import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
            Pageable pageable
    );

    Page<BlogDocument> findBlogsThatTag(
            Long taggedBlogId,
            Long currentUserId,
            boolean isAdmin,
            Pageable pageable
    );
}

