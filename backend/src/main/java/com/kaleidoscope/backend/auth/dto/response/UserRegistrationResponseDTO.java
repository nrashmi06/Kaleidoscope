package com.kaleidoscope.backend.auth.dto.response;
import com.kaleidoscope.backend.auth.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserRegistrationResponseDTO {
    private Long userId;
    private String email;
    private String username;
    private Role role;
}