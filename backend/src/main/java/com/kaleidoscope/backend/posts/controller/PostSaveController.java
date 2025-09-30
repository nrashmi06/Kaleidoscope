package com.kaleidoscope.backend.posts.controller;

import com.kaleidoscope.backend.posts.controller.api.PostSaveApi;
import com.kaleidoscope.backend.posts.dto.response.PostSaveResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.routes.PostInteractionRoutes;
import com.kaleidoscope.backend.posts.service.PostSaveService;
import com.kaleidoscope.backend.shared.response.ApiResponse;
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
public class PostSaveController implements PostSaveApi {
    
    private final PostSaveService postSaveService;

    @Override
    @PostMapping(PostInteractionRoutes.SAVE_POST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostSaveResponseDTO>> saveOrUnsavePost(
            @PathVariable Long postId,
            @RequestParam(name = "unsave", defaultValue = "false") boolean unsave
    ) {
        log.info("Processing save/unsave request for postId: {}, unsave: {}", postId, unsave);
        PostSaveResponseDTO result = postSaveService.saveOrUnsavePost(postId, unsave);
        return ResponseEntity.ok(ApiResponse.<PostSaveResponseDTO>builder()
                .success(true)
                .message(unsave ? "Post unsaved successfully" : "Post saved successfully")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(PostInteractionRoutes.SAVE_POST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostSaveResponseDTO>> getPostSaveStatus(@PathVariable Long postId) {
        log.info("Getting save status for postId: {}", postId);
        PostSaveResponseDTO result = postSaveService.getPostSaveStatus(postId);
        return ResponseEntity.ok(ApiResponse.<PostSaveResponseDTO>builder()
                .success(true)
                .message("Post save status retrieved successfully")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(PostInteractionRoutes.SAVED_POSTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginatedResponse<PostSummaryResponseDTO>>> getSavedPosts(Pageable pageable) {
        log.info("Getting saved posts for current user with pagination: page={}, size={}",
                pageable.getPageNumber(), pageable.getPageSize());
        PaginatedResponse<PostSummaryResponseDTO> result = postSaveService.getSavedPosts(pageable);
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<PostSummaryResponseDTO>>builder()
                .success(true)
                .message("Saved posts retrieved successfully")
                .data(result)
                .build());
    }
}
