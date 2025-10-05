package com.kaleidoscope.backend.posts.dto.response;

import java.time.LocalDateTime;

public record PostSaveResponseDTO(boolean saved, long totalSaves, LocalDateTime savedAt) {}
