package com.kaleidoscope.backend.blogs.controller.api;

import com.kaleidoscope.backend.blogs.dto.response.BlogSaveResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.blogs.routes.BlogInteractionRoutes;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Blog Saves", description = "Save and unsave blogs")
public interface BlogSaveApi {

    @Operation(summary = "Save or unsave a blog")
    @PostMapping(BlogInteractionRoutes.SAVE_BLOG)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<BlogSaveResponseDTO>> saveOrUnsaveBlog(
            @PathVariable Long blogId,
            @RequestParam(name = "unsave", defaultValue = "false") boolean unsave
    );

    @Operation(summary = "Get save status for a blog")
    @GetMapping(BlogInteractionRoutes.SAVE_BLOG)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<BlogSaveResponseDTO>> getBlogSaveStatus(@PathVariable Long blogId);

    @Operation(summary = "Get current user's saved blogs")
    @GetMapping(BlogInteractionRoutes.SAVED_BLOGS)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<PaginatedResponse<BlogSummaryResponseDTO>>> getSavedBlogs(Pageable pageable);
}

