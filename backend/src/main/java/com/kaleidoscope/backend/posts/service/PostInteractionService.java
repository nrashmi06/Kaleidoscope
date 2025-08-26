package com.kaleidoscope.backend.posts.service;

import com.kaleidoscope.backend.posts.dto.response.PostCommentResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostReactionResponseDTO;
import com.kaleidoscope.backend.posts.enums.ReactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostInteractionService {
    PostReactionResponseDTO reactOrUnreact(Long postId, ReactionType reactionType, boolean unreact);
    PostReactionResponseDTO getReactionSummary(Long postId);

    // Comments
    PostCommentResponseDTO addComment(Long postId, String body);
    Page<PostCommentResponseDTO> listComments(Long postId, Pageable pageable);
    void deleteComment(Long postId, Long commentId);
}


