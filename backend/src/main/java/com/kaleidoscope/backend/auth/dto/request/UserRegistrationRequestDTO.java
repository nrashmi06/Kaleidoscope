package com.kaleidoscope.backend.auth.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserRegistrationRequestDTO {
    private String email;
    private String password;
    private String houseId;
    private String username;
}