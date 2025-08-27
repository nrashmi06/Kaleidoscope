package com.kaleidoscope.backend.posts.controller;

import com.kaleidoscope.backend.posts.controller.api.PostInteractionApi;
import com.kaleidoscope.backend.shared.dto.request.ReactionRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.ReactionResponseDTO;
import com.kaleidoscope.backend.shared.dto.request.CommentCreateRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CommentResponseDTO;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.posts.routes.PostInteractionRoutes;
import com.kaleidoscope.backend.shared.service.InteractionService;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.kaleidoscope.backend.shared.dto.response.CommentReactionResponseDTO;

@RestController
@RequiredArgsConstructor
public class PostInteractionController implements PostInteractionApi {

    private final InteractionService interactionService;

    @Override
    @PostMapping(PostInteractionRoutes.REACT_TO_POST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReactionResponseDTO>> reactOrUnreact(
            @PathVariable Long postId,
            @RequestParam(name = "unreact", defaultValue = "false") boolean unreact,
            @Valid @RequestBody(required = false) ReactionRequestDTO body
    ) {
        ReactionType reactionType = body != null ? body.getReactionType() : null;
        if (!unreact && reactionType == null) {
            return ResponseEntity.badRequest().body(ApiResponse.<ReactionResponseDTO>builder()
                    .success(false)
                    .message("reactionType is required when unreact=false")
                    .data(null)
                    .build());
        }
        ReactionResponseDTO result = interactionService.reactOrUnreact(postId, reactionType, unreact);
        return ResponseEntity.ok(ApiResponse.<ReactionResponseDTO>builder()
                .success(true)
                .message(unreact ? "Reaction removed" : "Reaction updated")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(PostInteractionRoutes.REACT_TO_POST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReactionResponseDTO>> getReactionSummary(@PathVariable Long postId) {
        ReactionResponseDTO result = interactionService.getReactionSummary(postId);
        return ResponseEntity.ok(ApiResponse.<ReactionResponseDTO>builder()
                .success(true)
                .message("Reaction summary fetched")
                .data(result)
                .build());
    }

    @Override
    @PostMapping(PostInteractionRoutes.COMMENTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentResponseDTO>> addComment(@PathVariable Long postId,
                                                                      @Valid @RequestBody CommentCreateRequestDTO requestDTO) {
        CommentResponseDTO result = interactionService.addComment(postId, requestDTO.getBody());
        return ResponseEntity.ok(ApiResponse.<CommentResponseDTO>builder()
                .success(true)
                .message("Comment added")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(PostInteractionRoutes.COMMENTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<CommentResponseDTO>>> listComments(@PathVariable Long postId, Pageable pageable) {
        Page<CommentResponseDTO> page = interactionService.listComments(postId, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<CommentResponseDTO>>builder()
                .success(true)
                .message("Comments fetched")
                .data(page)
                .build());
    }

    @Override
    @DeleteMapping(PostInteractionRoutes.COMMENT_BY_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> deleteComment(@PathVariable Long postId, @PathVariable Long commentId) {
        interactionService.deleteComment(postId, commentId);
        return ResponseEntity.ok(ApiResponse.<Object>builder()
                .success(true)
                .message("Comment deleted")
                .data(null)
                .build());
    }

    @Override
    @PostMapping(PostInteractionRoutes.REACT_TO_COMMENT)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentReactionResponseDTO>> reactOrUnreactToComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestParam(name = "unreact", defaultValue = "false") boolean unreact,
            @Valid @RequestBody(required = false) ReactionRequestDTO body
    ) {
        ReactionType reactionType = body != null ? body.getReactionType() : null;
        if (!unreact && reactionType == null) {
            return ResponseEntity.badRequest().body(ApiResponse.<CommentReactionResponseDTO>builder()
                    .success(false)
                    .message("reactionType is required when unreact=false")
                    .data(null)
                    .build());
        }
        CommentReactionResponseDTO result = interactionService.reactOrUnreactToComment(postId, commentId, reactionType, unreact);
        return ResponseEntity.ok(ApiResponse.<CommentReactionResponseDTO>builder()
                .success(true)
                .message(unreact ? "Reaction removed" : "Reaction updated")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(PostInteractionRoutes.REACT_TO_COMMENT)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentReactionResponseDTO>> getCommentReactionSummary(
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        CommentReactionResponseDTO result = interactionService.getCommentReactionSummary(postId, commentId);
        return ResponseEntity.ok(ApiResponse.<CommentReactionResponseDTO>builder()
                .success(true)
                .message("Reaction summary fetched")
                .data(result)
                .build());
    }
}
