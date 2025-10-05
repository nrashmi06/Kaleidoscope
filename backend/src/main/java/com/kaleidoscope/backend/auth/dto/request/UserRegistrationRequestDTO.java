package com.kaleidoscope.backend.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Schema(description = "User registration request data")
public class UserRegistrationRequestDTO {

    @Schema(description = "User's email address", example = "john.doe@company.com", required = true)
    @Email(message = "Please provide a valid email address")
    @NotBlank(message = "Email is required")
    private String email;

    @Schema(description = "User's password (minimum 8 characters)", example = "SecurePassword123!", required = true, minLength = 8)
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    @Schema(description = "Unique username", example = "johndoe", required = true, minLength = 3, maxLength = 50)
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @Schema(description = "User's job designation", example = "Senior Software Engineer", maxLength = 100)
    @Size(max = 100, message = "Designation must not exceed 100 characters")
    private String designation;

    @Schema(description = "Brief summary about the user", example = "Passionate developer with 5 years of experience in full-stack development", maxLength = 500)
    @Size(max = 500, message = "Summary must not exceed 500 characters")
    private String summary;

    // These fields will be set separately when handling multipart requests
    @Schema(description = "Profile picture file (handled separately in multipart request)", hidden = true)
    @Builder.Default
    private MultipartFile profilePicture = null;
}