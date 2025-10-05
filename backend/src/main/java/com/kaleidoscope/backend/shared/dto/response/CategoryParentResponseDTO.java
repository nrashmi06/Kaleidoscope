package com.kaleidoscope.backend.shared.dto.response;

public record CategoryParentResponseDTO(Long categoryId, String name, String description, String iconName, Long parentId) {}
