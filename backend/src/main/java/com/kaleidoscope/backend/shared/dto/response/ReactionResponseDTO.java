package com.kaleidoscope.backend.shared.dto.response;

import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;

import java.util.Map;

public record ReactionResponseDTO(Long contentId, ContentType contentType, ReactionType currentUserReaction, Map<ReactionType, Long> countsByType, Long totalReactions) {}
