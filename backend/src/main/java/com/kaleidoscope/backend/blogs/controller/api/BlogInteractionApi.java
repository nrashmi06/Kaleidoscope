package com.kaleidoscope.backend.blogs.controller.api;

import com.kaleidoscope.backend.shared.dto.request.ReactionRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.ReactionResponseDTO;
import com.kaleidoscope.backend.shared.dto.request.CommentCreateRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CommentResponseDTO;
import com.kaleidoscope.backend.blogs.routes.BlogInteractionRoutes;
import com.kaleidoscope.backend.shared.response.AppResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Blog Interactions", description = "React / Unreact and reaction summary for blogs")
public interface BlogInteractionApi {

    @Operation(summary = "React or unreact to a blog")
    @PostMapping(BlogInteractionRoutes.REACT_TO_BLOG)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<ReactionResponseDTO>> reactOrUnreact(
            @PathVariable Long blogId,
            @RequestParam(name = "unreact", defaultValue = "false") boolean unreact,
            @Valid @RequestBody(required = false) ReactionRequestDTO body
    );

    @Operation(summary = "Get reaction summary for a blog")
    @GetMapping(BlogInteractionRoutes.REACT_TO_BLOG)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<ReactionResponseDTO>> getReactionSummary(@PathVariable Long blogId);

    // Comments
    @Operation(summary = "Add a comment to a blog")
    @PostMapping(BlogInteractionRoutes.COMMENTS)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<CommentResponseDTO>> addComment(@PathVariable Long blogId,
                                                               @Valid @RequestBody CommentCreateRequestDTO requestDTO);

    @Operation(summary = "List comments for a blog")
    @GetMapping(BlogInteractionRoutes.COMMENTS)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<Page<CommentResponseDTO>>> listComments(@PathVariable Long blogId, Pageable pageable);

    @Operation(summary = "Delete a comment")
    @DeleteMapping(BlogInteractionRoutes.COMMENT_BY_ID)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<Object>> deleteComment(@PathVariable Long blogId, @PathVariable Long commentId);

    @Operation(summary = "React or unreact to a comment")
    @PostMapping(BlogInteractionRoutes.REACT_TO_COMMENT)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<ReactionResponseDTO>> reactOrUnreactToComment(
            @PathVariable Long blogId,
            @PathVariable Long commentId,
            @RequestParam(name = "unreact", defaultValue = "false") boolean unreact,
            @Valid @RequestBody(required = false) ReactionRequestDTO body
    );

    @Operation(summary = "Get reaction summary for a comment")
    @GetMapping(BlogInteractionRoutes.REACT_TO_COMMENT)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<ReactionResponseDTO>> getCommentReactionSummary(
            @PathVariable Long blogId,
            @PathVariable Long commentId
    );
}

