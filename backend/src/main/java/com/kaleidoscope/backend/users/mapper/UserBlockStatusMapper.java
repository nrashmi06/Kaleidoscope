package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.dto.response.BlockStatusResponseDTO;
import com.kaleidoscope.backend.users.model.UserBlock;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UserBlockStatusMapper {

    /**
     * Analyze block relationships between two users and build status response
     * Eliminates complex logic from checkBlockStatus method
     */
    public BlockStatusResponseDTO buildBlockStatusResponse(List<UserBlock> blocks, Long currentUserId) {
        UserBlock currentUserBlocksTarget = null;
        UserBlock targetUserBlocksCurrent = null;

        // Analyze blocks to determine relationships
        for (UserBlock block : blocks) {
            if (block.getBlocker().getUserId().equals(currentUserId)) {
                currentUserBlocksTarget = block;
            } else {
                targetUserBlocksCurrent = block;
            }
        }

        return BlockStatusResponseDTO.builder()
                .isBlocked(currentUserBlocksTarget != null)
                .isBlockedBy(targetUserBlocksCurrent != null)
                .blockId(currentUserBlocksTarget != null ? currentUserBlocksTarget.getBlockId() : null)
                .build();
    }
}
