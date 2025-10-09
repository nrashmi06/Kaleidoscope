package com.kaleidoscope.backend.users.dto.response;

import java.time.LocalDateTime;

public record UserBlockResponseDTO(Long blockId, UserDetailsSummaryResponseDTO blocker, UserDetailsSummaryResponseDTO blocked, LocalDateTime createdAt) {}
