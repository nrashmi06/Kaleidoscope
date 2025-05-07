package com.kaleidoscope.backend.users.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDetailsSummaryResponseDTO {
    private Long userId;
    private String email;
    private String username;
    private String accountStatus;
}