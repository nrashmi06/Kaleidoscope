package com.kaleidoscope.backend.shared.dto.response;

import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionResponseDTO {
    private Long contentId;
    private ContentType contentType;
    private ReactionType currentUserReaction; // null if none
    private Map<ReactionType, Long> countsByType;
    private Long totalReactions;
}