package com.kaleidoscope.backend.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailsSummaryResponseDTO {
    private Long userId;
    private String email;
    private String anonymousName;
    private String profileStatus;
}