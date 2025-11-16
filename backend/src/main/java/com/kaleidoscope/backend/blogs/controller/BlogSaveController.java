package com.kaleidoscope.backend.blogs.controller;

import com.kaleidoscope.backend.blogs.controller.api.BlogSaveApi;
import com.kaleidoscope.backend.blogs.dto.response.BlogSaveResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.blogs.routes.BlogInteractionRoutes;
import com.kaleidoscope.backend.blogs.service.BlogSaveService;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Slf4j
public class BlogSaveController implements BlogSaveApi {
    
    private final BlogSaveService blogSaveService;

    @Override
    @PostMapping(BlogInteractionRoutes.SAVE_BLOG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<BlogSaveResponseDTO>> saveOrUnsaveBlog(
            @PathVariable Long blogId,
            @RequestParam(name = "unsave", defaultValue = "false") boolean unsave
    ) {
        log.info("Processing save/unsave request for blogId: {}, unsave: {}", blogId, unsave);
        BlogSaveResponseDTO result = blogSaveService.saveOrUnsaveBlog(blogId, unsave);
        return ResponseEntity.ok(AppResponse.<BlogSaveResponseDTO>builder()
                .success(true)
                .message(unsave ? "Blog unsaved successfully" : "Blog saved successfully")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(BlogInteractionRoutes.SAVE_BLOG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<BlogSaveResponseDTO>> getBlogSaveStatus(@PathVariable Long blogId) {
        log.info("Getting save status for blogId: {}", blogId);
        BlogSaveResponseDTO result = blogSaveService.getBlogSaveStatus(blogId);
        return ResponseEntity.ok(AppResponse.<BlogSaveResponseDTO>builder()
                .success(true)
                .message("Blog save status retrieved successfully")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(BlogInteractionRoutes.SAVED_BLOGS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<PaginatedResponse<BlogSummaryResponseDTO>>> getSavedBlogs(Pageable pageable) {
        log.info("Getting saved blogs for current user with pagination: page={}, size={}",
                pageable.getPageNumber(), pageable.getPageSize());
        PaginatedResponse<BlogSummaryResponseDTO> result = blogSaveService.getSavedBlogs(pageable);
        return ResponseEntity.ok(AppResponse.<PaginatedResponse<BlogSummaryResponseDTO>>builder()
                .success(true)
                .message("Saved blogs retrieved successfully")
                .data(result)
                .build());
    }
}

