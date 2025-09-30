package com.kaleidoscope.backend.shared.mapper;

import com.kaleidoscope.backend.shared.dto.response.CommentResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.ReactionResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.shared.model.Comment;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;
import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class InteractionMapper {
    public CommentResponseDTO toCommentDTO(Comment comment, Set<UserTagResponseDTO> tags) {
        return CommentResponseDTO.builder()
                .commentId(comment.getCommentId())
                .contentId(comment.getContentId())
                .contentType(comment.getContentType())
                .body(comment.getBody())
                .status(comment.getStatus())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .author(toUserDTO(comment.getUser()))
                .tags(tags)
                .build();
    }
    private UserDetailsSummaryResponseDTO toUserDTO(User user) {
        if (user == null) return null;
        return UserDetailsSummaryResponseDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .accountStatus(user.getAccountStatus().name())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build();
    }

    public ReactionResponseDTO toReactionSummary(Long contentId, ContentType contentType, ReactionType currentUserReaction, List<Object[]> countsRaw) {
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
                .contentId(contentId)
                .contentType(contentType)
                .currentUserReaction(currentUserReaction)
                .countsByType(countsByType)
                .totalReactions(total)
                .build();
    }
}