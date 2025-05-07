package com.kaleidoscope.backend.auth.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserRegistrationRequestDTO {
    private String email;
    private String password;
    private String username;
    private String designation;
    private String summary;

    // These fields will be set separately when handling multipart requests
    @Builder.Default
    private MultipartFile profilePicture = null;
}