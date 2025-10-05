package com.kaleidoscope.backend.shared.service;

import com.kaleidoscope.backend.shared.dto.request.CommentCreateRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CommentResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.ReactionResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InteractionService {
    ReactionResponseDTO reactOrUnreact(ContentType contentType, Long contentId, ReactionType reactionType, boolean unreact);
    ReactionResponseDTO getReactionSummary(ContentType contentType, Long contentId);

    // Comments
    CommentResponseDTO addComment(ContentType contentType, Long contentId, CommentCreateRequestDTO requestDTO);
    Page<CommentResponseDTO> listComments(ContentType contentType, Long contentId, Pageable pageable);
    void deleteComment(Long contentId, Long commentId);
}