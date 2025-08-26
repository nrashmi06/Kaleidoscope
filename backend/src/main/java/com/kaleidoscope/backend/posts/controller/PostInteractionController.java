package com.kaleidoscope.backend.posts.controller;

import com.kaleidoscope.backend.posts.controller.api.PostInteractionApi;
import com.kaleidoscope.backend.posts.dto.request.PostReactionRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostReactionResponseDTO;
import com.kaleidoscope.backend.posts.enums.ReactionType;
import com.kaleidoscope.backend.posts.routes.PostInteractionRoutes;
import com.kaleidoscope.backend.posts.service.PostInteractionService;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class PostInteractionController implements PostInteractionApi {

    private final PostInteractionService postInteractionService;

    @Override
    @PostMapping(PostInteractionRoutes.REACT_TO_POST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostReactionResponseDTO>> reactOrUnreact(
            @PathVariable Long postId,
            @RequestParam(name = "unreact", defaultValue = "false") boolean unreact,
            @Valid @RequestBody(required = false) PostReactionRequestDTO body
    ) {
        ReactionType reactionType = body != null ? body.getReactionType() : null;
        if (!unreact && reactionType == null) {
            return ResponseEntity.badRequest().body(ApiResponse.<PostReactionResponseDTO>builder()
                    .success(false)
                    .message("reactionType is required when unreact=false")
                    .data(null)
                    .build());
        }
        PostReactionResponseDTO result = postInteractionService.reactOrUnreact(postId, reactionType, unreact);
        return ResponseEntity.ok(ApiResponse.<PostReactionResponseDTO>builder()
                .success(true)
                .message(unreact ? "Reaction removed" : "Reaction updated")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(PostInteractionRoutes.REACT_TO_POST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostReactionResponseDTO>> getReactionSummary(@PathVariable Long postId) {
        PostReactionResponseDTO result = postInteractionService.getReactionSummary(postId);
        return ResponseEntity.ok(ApiResponse.<PostReactionResponseDTO>builder()
                .success(true)
                .message("Reaction summary fetched")
                .data(result)
                .build());
    }
}


