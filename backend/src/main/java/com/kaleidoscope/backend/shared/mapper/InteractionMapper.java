package com.kaleidoscope.backend.shared.mapper;

import com.kaleidoscope.backend.shared.dto.response.CommentReactionResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CommentResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.ReactionResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.UserSummaryResponseDTO;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.shared.model.Comment;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class InteractionMapper {
    // PostCommentMapper logic
    public CommentResponseDTO toCommentDTO(Comment comment) {
        return CommentResponseDTO.builder()
                .commentId(comment.getCommentId())
                .contentId(comment.getContentId()) // Changed from getPost().getPostId()
                .contentType(comment.getContentType()) // Added contentType
                .body(comment.getBody())
                .status(comment.getStatus())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .author(toUserDTO(comment.getUser()))
                .build();
    }
    private UserSummaryResponseDTO toUserDTO(User user) {
        if (user == null) return null;
        UserSummaryResponseDTO dto = new UserSummaryResponseDTO();
        dto.setUserId(user.getUserId());
        dto.setUsername(user.getUsername());
        return dto;
    }

    // PostReactionMapper logic (no changes needed here for now)
    public ReactionResponseDTO toPostReactionSummary(Long postId, ReactionType currentUserReaction, List<Object[]> countsRaw) {
        Map<ReactionType, Long> countsByType = new EnumMap<>(ReactionType.class);
        long total = 0L;
        if (countsRaw != null) {
            for (Object[] row : countsRaw) {
                ReactionType type = (ReactionType) row[0];
                Long count = (Long) row[1];
                countsByType.put(type, count);
                total += count;
            }
        }
        return ReactionResponseDTO.builder()
                .postId(postId)
                .currentUserReaction(currentUserReaction)
                .countsByType(countsByType)
                .totalReactions(total)
                .build();
    }

    // CommentReactionMapper logic (no changes needed here)
    public CommentReactionResponseDTO toCommentReactionSummary(Long commentId, ReactionType currentUserReaction, List<Object[]> counts) {
        Map<ReactionType, Long> reactionCounts = new HashMap<>();
        for (Object[] row : counts) {
            ReactionType type = (ReactionType) row[0];
            Long count = (Long) row[1];
            reactionCounts.put(type, count);
        }
        return CommentReactionResponseDTO.builder()
                .commentId(commentId)
                .currentUserReaction(currentUserReaction)
                .reactionCounts(reactionCounts)
                .build();
    }
}