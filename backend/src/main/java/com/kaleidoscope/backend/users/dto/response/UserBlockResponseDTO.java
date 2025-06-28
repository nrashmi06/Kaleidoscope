package com.kaleidoscope.backend.users.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBlockResponseDTO {

    private Long blockId;
    private UserDetailsSummaryResponseDTO blocker;
    private UserDetailsSummaryResponseDTO blocked;
    private LocalDateTime createdAt;
}
