package com.kaleidoscope.backend.auth.dto.request;

public record ChangePasswordRequestDTO(
    String oldPassword,
    String newPassword
) {
}
