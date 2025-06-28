package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.dto.response.UserBlockResponseDTO;
import com.kaleidoscope.backend.users.model.UserBlock;

public final class UserBlockMapper {

    private UserBlockMapper() {
        throw new IllegalStateException("Utility class");
    }

    public static UserBlockResponseDTO toUserBlockResponseDTO(UserBlock userBlock) {
        if (userBlock == null) {
            return null;
        }

        return UserBlockResponseDTO.builder()
                .blockId(userBlock.getBlockId())
                .blocker(UserMapper.toUserDetailsSummaryResponseDTO(userBlock.getBlocker()))
                .blocked(UserMapper.toUserDetailsSummaryResponseDTO(userBlock.getBlocked()))
                .createdAt(userBlock.getCreatedAt())
                .build();
    }
}
