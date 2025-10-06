package com.kaleidoscope.backend.users.dto.request;

public record UpdateUserProfileStatusRequestDTO(
    Long userId,
    String profileStatus
) {
}
