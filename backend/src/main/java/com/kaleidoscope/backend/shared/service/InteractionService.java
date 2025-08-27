package com.kaleidoscope.backend.shared.service;

import com.kaleidoscope.backend.shared.dto.response.CommentReactionResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CommentResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.ReactionResponseDTO;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InteractionService {
    ReactionResponseDTO reactOrUnreact(Long postId, ReactionType reactionType, boolean unreact);
    ReactionResponseDTO getReactionSummary(Long postId);

    // Comments
    CommentResponseDTO addComment(Long postId, String body);
    Page<CommentResponseDTO> listComments(Long postId, Pageable pageable);
    void deleteComment(Long postId, Long commentId);

    // Comment Reactions
    CommentReactionResponseDTO reactOrUnreactToComment(Long postId, Long commentId, ReactionType reactionType, boolean unreact);
    CommentReactionResponseDTO getCommentReactionSummary(Long postId, Long commentId);
}
