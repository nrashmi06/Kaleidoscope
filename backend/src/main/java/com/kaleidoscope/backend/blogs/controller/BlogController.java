package com.kaleidoscope.backend.blogs.controller;

import com.kaleidoscope.backend.blogs.controller.api.BlogApi;
import com.kaleidoscope.backend.blogs.dto.request.BlogCreateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogCreationResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogDetailResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.blogs.routes.BlogsRoutes;
import com.kaleidoscope.backend.blogs.service.BlogService;
import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Slf4j
public class BlogController implements BlogApi {
    
    private final BlogService blogService;
    private final ImageStorageService imageStorageService;

    @Override
    @PostMapping(BlogsRoutes.GENERATE_UPLOAD_SIGNATURES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UploadSignatureResponseDTO>> generateUploadSignatures(
            @Valid @RequestBody GenerateUploadSignatureRequestDTO requestDTO) {
        log.info("Generating upload signatures for {} files", requestDTO.getFileNames().size());
        requestDTO.setContentType(ContentType.BLOG.name());
        UploadSignatureResponseDTO response = imageStorageService.generateUploadSignatures(requestDTO);
        return ResponseEntity.ok(ApiResponse.<UploadSignatureResponseDTO>builder()
                .success(true)
                .message("Signatures generated successfully.")
                .data(response)
                .build());
    }

    @Override
    @PostMapping(BlogsRoutes.CREATE_BLOG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BlogCreationResponseDTO>> createBlog(
            @Valid @RequestBody BlogCreateRequestDTO blogCreateRequestDTO) {
        log.info("Creating blog with title: {}", blogCreateRequestDTO.getTitle());
        BlogCreationResponseDTO createdBlog = blogService.createBlog(blogCreateRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<BlogCreationResponseDTO>builder()
                        .success(true)
                        .message("Blog created successfully")
                        .data(createdBlog)
                        .build());
    }

    @Override
    @PutMapping(BlogsRoutes.UPDATE_BLOG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BlogCreationResponseDTO>> updateBlog(
            @PathVariable Long blogId, 
            @Valid @RequestBody BlogUpdateRequestDTO requestDTO) {
        log.info("Updating blog with ID: {}", blogId);
        BlogCreationResponseDTO updatedBlog = blogService.updateBlog(blogId, requestDTO);
        return ResponseEntity.ok(ApiResponse.<BlogCreationResponseDTO>builder()
                .success(true)
                .message("Blog updated successfully")
                .data(updatedBlog)
                .build());
    }

    @Override
    @DeleteMapping(BlogsRoutes.DELETE_BLOG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> deleteBlog(@PathVariable Long blogId) {
        log.info("Soft deleting blog with ID: {}", blogId);
        blogService.softDeleteBlog(blogId);
        return ResponseEntity.ok(ApiResponse.<Object>builder()
                .success(true)
                .message("Blog deleted successfully")
                .data(null)
                .build());
    }

    @Override
    @DeleteMapping(BlogsRoutes.HARD_DELETE_BLOG)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> hardDeleteBlog(@PathVariable Long blogId) {
        log.info("Hard deleting blog with ID: {}", blogId);
        blogService.hardDeleteBlog(blogId);
        return ResponseEntity.ok(ApiResponse.<Object>builder()
                .success(true)
                .message("Blog hard deleted successfully")
                .data(null)
                .build());
    }

    @Override
    @GetMapping(BlogsRoutes.GET_BLOG_BY_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BlogDetailResponseDTO>> getBlogById(@PathVariable Long blogId) {
        log.info("Retrieving blog with ID: {}", blogId);
        BlogDetailResponseDTO blog = blogService.getBlogById(blogId);
        return ResponseEntity.ok(ApiResponse.<BlogDetailResponseDTO>builder()
                .success(true)
                .message("Blog retrieved successfully")
                .data(blog)
                .build());
    }

    @Override
    @GetMapping(BlogsRoutes.FILTER_BLOGS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginatedResponse<BlogSummaryResponseDTO>>> filterBlogs(
            Pageable pageable,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String q
    ) {
        PaginatedResponse<BlogSummaryResponseDTO> response = blogService.filterBlogs(pageable, userId, categoryId, status, visibility, q);
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<BlogSummaryResponseDTO>>builder()
                .success(true)
                .message("Blogs retrieved successfully.")
                .data(response)
                .build());
    }
}
