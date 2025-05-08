package com.kaleidoscope.backend.users.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateUserProfileRequestDTO {
    private String username;
    private String designation;
    private String summary;
    private MultipartFile profilePicture;
    private MultipartFile coverPhoto;
}