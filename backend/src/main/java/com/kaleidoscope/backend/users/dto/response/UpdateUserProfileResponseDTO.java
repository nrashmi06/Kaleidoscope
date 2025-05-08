package com.kaleidoscope.backend.users.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateUserProfileResponseDTO {
    private Long userId;
    private String email;
    private String username;
    private String designation;
    private String summary;
    private String profilePictureUrl;
    private String coverPhotoUrl;
}