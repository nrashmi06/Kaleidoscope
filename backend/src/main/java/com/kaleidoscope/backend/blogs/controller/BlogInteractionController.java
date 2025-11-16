package com.kaleidoscope.backend.blogs.controller;

import com.kaleidoscope.backend.blogs.controller.api.BlogInteractionApi;
import com.kaleidoscope.backend.shared.dto.request.ReactionRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.ReactionResponseDTO;
import com.kaleidoscope.backend.shared.dto.request.CommentCreateRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CommentResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.blogs.routes.BlogInteractionRoutes;
import com.kaleidoscope.backend.shared.service.InteractionService;
import com.kaleidoscope.backend.shared.response.AppResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class BlogInteractionController implements BlogInteractionApi {

    private final InteractionService interactionService;

    @Override
    @PostMapping(BlogInteractionRoutes.REACT_TO_BLOG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<ReactionResponseDTO>> reactOrUnreact(
            @PathVariable Long blogId,
            @RequestParam(name = "unreact", defaultValue = "false") boolean unreact,
            @Valid @RequestBody(required = false) ReactionRequestDTO body
    ) {
        ReactionType reactionType = body != null ? body.reactionType() : null;
        if (!unreact && reactionType == null) {
            return ResponseEntity.badRequest().body(AppResponse.<ReactionResponseDTO>builder()
                    .success(false)
                    .message("reactionType is required when unreact=false")
                    .data(null)
                    .build());
        }
        ReactionResponseDTO result = interactionService.reactOrUnreact(ContentType.BLOG, blogId, reactionType, unreact);
        return ResponseEntity.ok(AppResponse.<ReactionResponseDTO>builder()
                .success(true)
                .message(unreact ? "Reaction removed" : "Reaction updated")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(BlogInteractionRoutes.REACT_TO_BLOG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<ReactionResponseDTO>> getReactionSummary(@PathVariable Long blogId) {
        ReactionResponseDTO result = interactionService.getReactionSummary(ContentType.BLOG, blogId);
        return ResponseEntity.ok(AppResponse.<ReactionResponseDTO>builder()
                .success(true)
                .message("Reaction summary fetched")
                .data(result)
                .build());
    }

    @Override
    @PostMapping(BlogInteractionRoutes.COMMENTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<CommentResponseDTO>> addComment(@PathVariable Long blogId,
                                                                      @Valid @RequestBody CommentCreateRequestDTO requestDTO) {
        CommentResponseDTO result = interactionService.addComment(ContentType.BLOG, blogId, requestDTO);
        return ResponseEntity.ok(AppResponse.<CommentResponseDTO>builder()
                .success(true)
                .message("Comment added")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(BlogInteractionRoutes.COMMENTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<Page<CommentResponseDTO>>> listComments(@PathVariable Long blogId, Pageable pageable) {
        Page<CommentResponseDTO> page = interactionService.listComments(ContentType.BLOG, blogId, pageable);
        return ResponseEntity.ok(AppResponse.<Page<CommentResponseDTO>>builder()
                .success(true)
                .message("Comments fetched")
                .data(page)
                .build());
    }

    @Override
    @DeleteMapping(BlogInteractionRoutes.COMMENT_BY_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<Object>> deleteComment(@PathVariable Long blogId, @PathVariable Long commentId) {
        interactionService.deleteComment(blogId, commentId);
        return ResponseEntity.ok(AppResponse.<Object>builder()
                .success(true)
                .message("Comment deleted")
                .data(null)
                .build());
    }

    @Override
    @PostMapping(BlogInteractionRoutes.REACT_TO_COMMENT)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<ReactionResponseDTO>> reactOrUnreactToComment(
            @PathVariable Long blogId,
            @PathVariable Long commentId,
            @RequestParam(name = "unreact", defaultValue = "false") boolean unreact,
            @Valid @RequestBody(required = false) ReactionRequestDTO body
    ) {
        ReactionType reactionType = body != null ? body.reactionType() : null;
        if (!unreact && reactionType == null) {
            return ResponseEntity.badRequest().body(AppResponse.<ReactionResponseDTO>builder()
                    .success(false)
                    .message("reactionType is required when unreact=false")
                    .data(null)
                    .build());
        }
        ReactionResponseDTO result = interactionService.reactOrUnreact(ContentType.COMMENT, commentId, reactionType, unreact);
        return ResponseEntity.ok(AppResponse.<ReactionResponseDTO>builder()
                .success(true)
                .message(unreact ? "Reaction removed" : "Reaction updated")
                .data(result)
                .build());
    }

    @Override
    @GetMapping(BlogInteractionRoutes.REACT_TO_COMMENT)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<ReactionResponseDTO>> getCommentReactionSummary(
            @PathVariable Long blogId,
            @PathVariable Long commentId
    ) {
        ReactionResponseDTO result = interactionService.getReactionSummary(ContentType.COMMENT, commentId);
        return ResponseEntity.ok(AppResponse.<ReactionResponseDTO>builder()
                .success(true)
                .message("Reaction summary fetched")
                .data(result)
                .build());
    }
}

