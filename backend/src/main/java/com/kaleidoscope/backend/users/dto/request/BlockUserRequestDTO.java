package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockUserRequestDTO {

    @NotNull(message = "User ID to block is required")
    private Long userIdToBlock;

    private String reason; // Optional reason for blocking
}
