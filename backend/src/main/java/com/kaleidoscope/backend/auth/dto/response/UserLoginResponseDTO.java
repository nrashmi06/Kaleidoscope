package com.kaleidoscope.backend.auth.dto.response;

public record UserLoginResponseDTO(Long userId, String email, String username, String role,String profilePictureUrl) {}
