package com.kaleidoscope.backend.users.dto.response;

import com.kaleidoscope.backend.shared.dto.response.CategoryResponseDTO;

import java.time.LocalDateTime;

public record UserInterestResponseDTO(Long interestId, Long userId, CategoryResponseDTO category, LocalDateTime createdAt) {}
