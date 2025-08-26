package com.kaleidoscope.backend.posts.controller.api;

import com.kaleidoscope.backend.posts.dto.request.PostReactionRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostReactionResponseDTO;
import com.kaleidoscope.backend.posts.routes.PostInteractionRoutes;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Post Interactions", description = "React / Unreact and reaction summary")
public interface PostInteractionApi {

    @Operation(summary = "React or unreact to a post")
    @PostMapping(PostInteractionRoutes.REACT_TO_POST)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<PostReactionResponseDTO>> reactOrUnreact(
            @PathVariable Long postId,
            @RequestParam(name = "unreact", defaultValue = "false") boolean unreact,
            @Valid @RequestBody(required = false) PostReactionRequestDTO body
    );

    @Operation(summary = "Get reaction summary for a post")
    @GetMapping(PostInteractionRoutes.REACT_TO_POST)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<PostReactionResponseDTO>> getReactionSummary(@PathVariable Long postId);
}


