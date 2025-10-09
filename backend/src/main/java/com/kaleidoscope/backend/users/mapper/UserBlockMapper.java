package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.dto.response.UserBlockResponseDTO;
import com.kaleidoscope.backend.users.model.UserBlock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserBlockMapper {

    public UserBlockResponseDTO toUserBlockResponseDTO(UserBlock userBlock) {
        return new UserBlockResponseDTO(
                userBlock.getBlockId(),
                UserMapper.toUserDetailsSummaryResponseDTO(userBlock.getBlocker()),
                UserMapper.toUserDetailsSummaryResponseDTO(userBlock.getBlocked()),
                userBlock.getCreatedAt()
        );
    }
}
