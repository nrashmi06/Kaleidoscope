package com.kaleidoscope.backend.posts.mapper;

import com.kaleidoscope.backend.posts.dto.response.CommentReactionResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCommentResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostReactionResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.UserResponseDTO;
import com.kaleidoscope.backend.posts.enums.ReactionType;
import com.kaleidoscope.backend.posts.model.PostComment;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class PostInteractionMapper {
    // PostCommentMapper logic
    public PostCommentResponseDTO toCommentDTO(PostComment comment) {
        return PostCommentResponseDTO.builder()
                .commentId(comment.getCommentId())
                .postId(comment.getPost().getPostId())
                .body(comment.getBody())
                .status(comment.getStatus())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .author(toUserDTO(comment.getUser()))
                .build();
    }
    private UserResponseDTO toUserDTO(User user) {
        if (user == null) return null;
        UserResponseDTO dto = new UserResponseDTO();
        dto.setUserId(user.getUserId());
        dto.setUsername(user.getUsername());
        return dto;
    }

    // PostReactionMapper logic
    public PostReactionResponseDTO toPostReactionSummary(Long postId, ReactionType currentUserReaction, List<Object[]> countsRaw) {
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
        return PostReactionResponseDTO.builder()
                .postId(postId)
                .currentUserReaction(currentUserReaction)
                .countsByType(countsByType)
                .totalReactions(total)
                .build();
    }

    // CommentReactionMapper logic
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

