package com.kaleidoscope.backend.users.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileStatusRequestDTO {
    private Long userId;
    private String profileStatus;
}
