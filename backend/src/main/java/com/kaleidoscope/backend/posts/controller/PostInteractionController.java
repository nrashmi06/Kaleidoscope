package com.kaleidoscope.backend.posts.controller;

import com.kaleidoscope.backend.posts.controller.api.PostInteractionApi;
import com.kaleidoscope.backend.posts.dto.request.ReactionRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostReactionResponseDTO;
import com.kaleidoscope.backend.posts.dto.request.PostCommentCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCommentResponseDTO;
import com.kaleidoscope.backend.posts.enums.ReactionType;
import com.kaleidoscope.backend.posts.routes.PostInteractionRoutes;
import com.kaleidoscope.backend.posts.service.PostInteractionService;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.kaleidoscope.backend.posts.dto.response.CommentReactionResponseDTO;

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
            @Valid @RequestBody(required = false) ReactionRequestDTO body
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

    @Override
    @PostMapping(PostInteractionRoutes.COMMENTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostCommentResponseDTO>> addComment(@PathVariable Long postId,
                                                                          @Valid @RequestBody PostCommentCreateRequestDTO requestDTO) {
        PostCommentResponseDTO result = postInteractionService.addComment(postId, requestDTO.getBody());
        return ResponseEntity.ok(ApiResponse.<PostCommentResponseDTO>builder()
                .success(true)
                .message("Comment added")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(PostInteractionRoutes.COMMENTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<PostCommentResponseDTO>>> listComments(@PathVariable Long postId, Pageable pageable) {
        Page<PostCommentResponseDTO> page = postInteractionService.listComments(postId, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<PostCommentResponseDTO>>builder()
                .success(true)
                .message("Comments fetched")
                .data(page)
                .build());
    }

    @Override
    @DeleteMapping(PostInteractionRoutes.COMMENT_BY_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> deleteComment(@PathVariable Long postId, @PathVariable Long commentId) {
        postInteractionService.deleteComment(postId, commentId);
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
        CommentReactionResponseDTO result = postInteractionService.reactOrUnreactToComment(postId, commentId, reactionType, unreact);
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
        CommentReactionResponseDTO result = postInteractionService.getCommentReactionSummary(postId, commentId);
        return ResponseEntity.ok(ApiResponse.<CommentReactionResponseDTO>builder()
                .success(true)
                .message("Reaction summary fetched")
                .data(result)
                .build());
    }
}
