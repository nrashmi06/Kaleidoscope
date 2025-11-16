package com.kaleidoscope.backend.blogs.service;

import com.kaleidoscope.backend.blogs.dto.response.BlogSaveResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import org.springframework.data.domain.Pageable;

public interface BlogSaveService {
    BlogSaveResponseDTO saveOrUnsaveBlog(Long blogId, boolean unsave);
    BlogSaveResponseDTO getBlogSaveStatus(Long blogId);
    PaginatedResponse<BlogSummaryResponseDTO> getSavedBlogs(Pageable pageable);
}

