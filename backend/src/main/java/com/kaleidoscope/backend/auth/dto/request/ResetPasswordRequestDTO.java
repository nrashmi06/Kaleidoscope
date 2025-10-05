package com.kaleidoscope.backend.auth.dto.request;

public record ResetPasswordRequestDTO(
    String token,
    String newPassword
) {
}