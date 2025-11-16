package com.kaleidoscope.backend.blogs.service;

import com.kaleidoscope.backend.blogs.dto.request.BlogCreateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogStatusUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogCreationResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogDetailResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface BlogService {
    BlogCreationResponseDTO createBlog(BlogCreateRequestDTO blogCreateRequestDTO);
    BlogCreationResponseDTO updateBlog(Long blogId, BlogUpdateRequestDTO blogUpdateRequestDTO);
    void softDeleteBlog(Long blogId);
    void hardDeleteBlog(Long blogId);
    BlogDetailResponseDTO getBlogById(Long blogId);
    PaginatedResponse<BlogSummaryResponseDTO> filterBlogs(
            Pageable pageable, Long userId, Long categoryId, String status, String visibility, String q,
            Long locationId, Long nearbyLocationId, Double radiusKm,
            Long minReactions, Long minComments, LocalDateTime startDate, LocalDateTime endDate
    );
    BlogCreationResponseDTO updateBlogStatus(Long blogId, BlogStatusUpdateRequestDTO requestDTO);
    PaginatedResponse<BlogSummaryResponseDTO> getBlogsThatTag(Long blogId, Pageable pageable);
}
