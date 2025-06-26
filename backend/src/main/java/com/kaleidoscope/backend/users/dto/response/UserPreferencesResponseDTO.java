package com.kaleidoscope.backend.users.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferencesResponseDTO {
    private Long preferenceId;
    private Long userId;
    private String theme;
    private String language;
    private String profileVisibility;
    private String allowMessages;
    private String allowTagging;
    private String viewActivity;
    private Boolean showEmail;
    private Boolean showPhone;
    private Boolean showOnlineStatus;
    private Boolean searchDiscoverable;
    private String createdAt;
    private String updatedAt;
}
