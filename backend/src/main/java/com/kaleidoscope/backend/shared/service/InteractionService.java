package com.kaleidoscope.backend.shared.service;

import com.kaleidoscope.backend.shared.dto.response.CommentReactionResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CommentResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.ReactionResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InteractionService {
    ReactionResponseDTO reactOrUnreact(Long postId, ReactionType reactionType, boolean unreact);
    ReactionResponseDTO getReactionSummary(Long postId);

    // Comments - Updated signatures
    CommentResponseDTO addComment(ContentType contentType, Long contentId, String body);
    Page<CommentResponseDTO> listComments(ContentType contentType, Long contentId, Pageable pageable);
    void deleteComment(Long contentId, Long commentId);

    // Comment Reactions - Updated signatures
    CommentReactionResponseDTO reactOrUnreactToComment(Long contentId, Long commentId, ReactionType reactionType, boolean unreact);
    CommentReactionResponseDTO getCommentReactionSummary(Long contentId, Long commentId);
}