package com.kaleidoscope.backend.blogs.controller;

import com.kaleidoscope.backend.blogs.controller.api.BlogApi;
import com.kaleidoscope.backend.blogs.dto.request.BlogCreateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogStatusUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogCreationResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogDetailResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.blogs.routes.BlogsRoutes;
import com.kaleidoscope.backend.blogs.service.BlogService;
import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
@Slf4j
public class BlogController implements BlogApi {
    
    private final BlogService blogService;
    private final ImageStorageService imageStorageService;
    private final com.kaleidoscope.backend.blogs.service.BlogSuggestionService blogSuggestionService;

    @Override
    @PostMapping(BlogsRoutes.GENERATE_UPLOAD_SIGNATURES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<UploadSignatureResponseDTO>> generateUploadSignatures(
            @Valid @RequestBody GenerateUploadSignatureRequestDTO requestDTO) {
        log.info("Generating upload signatures for {} files", requestDTO.getFileNames().size());
        requestDTO.setContentType(ContentType.BLOG.name());
        UploadSignatureResponseDTO response = imageStorageService.generateUploadSignatures(requestDTO);
        return ResponseEntity.ok(AppResponse.<UploadSignatureResponseDTO>builder()
                .success(true)
                .message("Signatures generated successfully.")
                .data(response)
                .build());
    }

    @Override
    @PostMapping(BlogsRoutes.CREATE_BLOG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<BlogCreationResponseDTO>> createBlog(
            @Valid @RequestBody BlogCreateRequestDTO blogCreateRequestDTO) {
        log.info("Creating blog with title: {}", blogCreateRequestDTO != null ? blogCreateRequestDTO.title() : "null request");

        if (blogCreateRequestDTO == null) {
            log.error("Blog creation request is null");
            return ResponseEntity.badRequest()
                    .body(AppResponse.<BlogCreationResponseDTO>builder()
                            .success(false)
                            .message("Request body is required")
                            .data(null)
                            .build());
        }

        BlogCreationResponseDTO createdBlog = blogService.createBlog(blogCreateRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(AppResponse.<BlogCreationResponseDTO>builder()
                        .success(true)
                        .message("Blog created successfully")
                        .data(createdBlog)
                        .build());
    }

    @Override
    @PutMapping(BlogsRoutes.UPDATE_BLOG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<BlogCreationResponseDTO>> updateBlog(
            @PathVariable Long blogId, 
            @Valid @RequestBody BlogUpdateRequestDTO requestDTO) {
        log.info("Updating blog with ID: {}", blogId);
        BlogCreationResponseDTO updatedBlog = blogService.updateBlog(blogId, requestDTO);
        return ResponseEntity.ok(AppResponse.<BlogCreationResponseDTO>builder()
                .success(true)
                .message("Blog updated successfully")
                .data(updatedBlog)
                .build());
    }

    @Override
    @DeleteMapping(BlogsRoutes.DELETE_BLOG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<Object>> deleteBlog(@PathVariable Long blogId) {
        log.info("Soft deleting blog with ID: {}", blogId);
        blogService.softDeleteBlog(blogId);
        return ResponseEntity.ok(AppResponse.<Object>builder()
                .success(true)
                .message("Blog deleted successfully")
                .data(null)
                .build());
    }

    @Override
    @DeleteMapping(BlogsRoutes.HARD_DELETE_BLOG)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppResponse<Object>> hardDeleteBlog(@PathVariable Long blogId) {
        log.info("Hard deleting blog with ID: {}", blogId);
        blogService.hardDeleteBlog(blogId);
        return ResponseEntity.ok(AppResponse.<Object>builder()
                .success(true)
                .message("Blog hard deleted successfully")
                .data(null)
                .build());
    }

    @Override
    @GetMapping(BlogsRoutes.GET_BLOG_BY_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<BlogDetailResponseDTO>> getBlogById(@PathVariable Long blogId) {
        log.info("Retrieving blog with ID: {}", blogId);
        BlogDetailResponseDTO blog = blogService.getBlogById(blogId);
        return ResponseEntity.ok(AppResponse.<BlogDetailResponseDTO>builder()
                .success(true)
                .message("Blog retrieved successfully")
                .data(blog)
                .build());
    }

    @Override
    @GetMapping(BlogsRoutes.FILTER_BLOGS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<PaginatedResponse<BlogSummaryResponseDTO>>> filterBlogs(
            Pageable pageable,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Long nearbyLocationId,
            @RequestParam(required = false, defaultValue = "5.0") Double radiusKm,
            @RequestParam(required = false) Long minReactions,
            @RequestParam(required = false) Long minComments,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("Filtering blogs with params: userId={}, categoryId={}, status={}, locationId={}, nearbyLocationId={}, radiusKm={}, minReactions={}, minComments={}, startDate={}, endDate={}",
                userId, categoryId, status, locationId, nearbyLocationId, radiusKm, minReactions, minComments, startDate, endDate);
        PaginatedResponse<BlogSummaryResponseDTO> response = blogService.filterBlogs(
                pageable, userId, categoryId, status, visibility, q,
                locationId, nearbyLocationId, radiusKm,
                minReactions, minComments, startDate, endDate
        );
        return ResponseEntity.ok(AppResponse.<PaginatedResponse<BlogSummaryResponseDTO>>builder()
                .success(true)
                .message("Blogs retrieved successfully.")
                .data(response)
                .build());
    }

    @Override
    @PutMapping(BlogsRoutes.UPDATE_BLOG_STATUS)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppResponse<BlogCreationResponseDTO>> updateBlogStatus(
            @PathVariable Long blogId,
            @Valid @RequestBody BlogStatusUpdateRequestDTO requestDTO) {
        log.info("Admin updating blog status for blog ID: {} to status: {}", blogId, requestDTO.status());
        BlogCreationResponseDTO updatedBlog = blogService.updateBlogStatus(blogId, requestDTO);
        return ResponseEntity.ok(AppResponse.<BlogCreationResponseDTO>builder()
                .success(true)
                .message("Blog status updated successfully")
                .data(updatedBlog)
                .build());
    }

    @Override
    @GetMapping(BlogsRoutes.GET_TAGGED_BY)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<PaginatedResponse<BlogSummaryResponseDTO>>> getBlogsThatTag(
            @PathVariable Long blogId,
            Pageable pageable) {
        log.info("Retrieving blogs that tag blogId: {}", blogId);
        PaginatedResponse<BlogSummaryResponseDTO> response = blogService.getBlogsThatTag(blogId, pageable);
        return ResponseEntity.ok(AppResponse.<PaginatedResponse<BlogSummaryResponseDTO>>builder()
                .success(true)
                .message("Blogs retrieved successfully.")
                .data(response)
                .build());
    }

    @Override
    @GetMapping(BlogsRoutes.SUGGESTIONS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<PaginatedResponse<BlogSummaryResponseDTO>>> getBlogSuggestions(Pageable pageable) {
        log.info("Fetching blog suggestions for current user");
        PaginatedResponse<BlogSummaryResponseDTO> suggestions = blogSuggestionService.getBlogSuggestions(pageable);
        return ResponseEntity.ok(AppResponse.<PaginatedResponse<BlogSummaryResponseDTO>>builder()
                .success(true)
                .message("Blog suggestions retrieved successfully.")
                .data(suggestions)
                .build());
    }
}
