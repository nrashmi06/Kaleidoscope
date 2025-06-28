package com.kaleidoscope.backend.users.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockStatusResponseDTO {

    private boolean isBlocked;
    private boolean isBlockedBy;
    private Long blockId; // null if not blocked
}
