package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.dto.response.UserBlockResponseDTO;
import com.kaleidoscope.backend.users.model.UserBlock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserBlockMapper {

    public UserBlockResponseDTO toUserBlockResponseDTO(UserBlock userBlock) {
        return UserBlockResponseDTO.builder()
                .blockId(userBlock.getBlockId())
                .blocker(UserMapper.toUserDetailsSummaryResponseDTO(userBlock.getBlocker()))
                .blocked(UserMapper.toUserDetailsSummaryResponseDTO(userBlock.getBlocked()))
                .createdAt(userBlock.getCreatedAt())
                .build();
    }
}
