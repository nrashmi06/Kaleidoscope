package com.kaleidoscope.backend.blogs.dto.response;

import java.time.LocalDateTime;

public record BlogSaveResponseDTO(boolean saved, long totalSaves, LocalDateTime savedAt) {}

