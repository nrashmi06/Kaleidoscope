package com.kaleidoscope.backend.posts.service;

import com.kaleidoscope.backend.posts.dto.response.PostReactionResponseDTO;
import com.kaleidoscope.backend.posts.enums.ReactionType;

public interface PostInteractionService {
    PostReactionResponseDTO reactOrUnreact(Long postId, ReactionType reactionType, boolean unreact);
    PostReactionResponseDTO getReactionSummary(Long postId);
}


