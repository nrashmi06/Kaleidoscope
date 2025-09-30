package com.kaleidoscope.backend.posts.controller.api;

import com.kaleidoscope.backend.posts.dto.response.PostSaveResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.routes.PostInteractionRoutes;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Post Saves", description = "Save and unsave posts")
public interface PostSaveApi {

    @Operation(summary = "Save or unsave a post")
    @PostMapping(PostInteractionRoutes.SAVE_POST)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<PostSaveResponseDTO>> saveOrUnsavePost(
            @PathVariable Long postId,
            @RequestParam(name = "unsave", defaultValue = "false") boolean unsave
    );

    @Operation(summary = "Get save status for a post")
    @GetMapping(PostInteractionRoutes.SAVE_POST)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<PostSaveResponseDTO>> getPostSaveStatus(@PathVariable Long postId);

    @Operation(summary = "Get current user's saved posts")
    @GetMapping(PostInteractionRoutes.SAVED_POSTS)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<PaginatedResponse<PostSummaryResponseDTO>>> getSavedPosts(Pageable pageable);
}
