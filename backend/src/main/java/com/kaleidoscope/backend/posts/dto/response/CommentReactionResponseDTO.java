package com.kaleidoscope.backend.posts.dto.response;

import com.kaleidoscope.backend.posts.enums.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentReactionResponseDTO {
    private Long commentId;
    private ReactionType currentUserReaction;
    private Map<ReactionType, Long> reactionCounts;
}

