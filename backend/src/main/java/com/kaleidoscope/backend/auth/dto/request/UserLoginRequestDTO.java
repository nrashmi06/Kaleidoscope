package com.kaleidoscope.backend.auth.dto.request;

public record UserLoginRequestDTO(
    String email,
    String password
) {
}