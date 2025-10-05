package com.kaleidoscope.backend.users.dto.response;

public record UserDetailsSummaryResponseDTO(Long userId, String email, String username, String accountStatus, String profilePictureUrl) {}
