package com.kaleidoscope.backend.posts.mapper;

import com.kaleidoscope.backend.posts.dto.response.PostReactionResponseDTO;
import com.kaleidoscope.backend.posts.enums.ReactionType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class PostReactionMapper {

    public PostReactionResponseDTO toReactionSummary(Long postId,
                                                     ReactionType currentUserReaction,
                                                     List<Object[]> countsRaw) {
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
}


