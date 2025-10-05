package com.kaleidoscope.backend.users.dto.response;

public record BlockStatusResponseDTO(boolean isBlocked, boolean isBlockedBy, Long blockId) {}
