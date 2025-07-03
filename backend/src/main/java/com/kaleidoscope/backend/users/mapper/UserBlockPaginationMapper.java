package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.dto.response.BlockedUsersListResponseDTO;
import com.kaleidoscope.backend.users.model.UserBlock;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
@RequiredArgsConstructor
public class UserBlockPaginationMapper {

    private final UserMapper userMapper;

    /**
     * Build paginated response for blocked users
     * Eliminates duplication between getBlockedUsers and getUsersWhoBlockedMe
     */
    public BlockedUsersListResponseDTO buildBlockedUsersResponse(
            Page<UserBlock> userBlocksPage,
            Function<UserBlock, com.kaleidoscope.backend.users.model.User> userExtractor) {

        return BlockedUsersListResponseDTO.builder()
                .blockedUsers(userBlocksPage.getContent().stream()
                        .map(userExtractor)
                        .map(UserMapper::toUserDetailsSummaryResponseDTO)
                        .toList())
                .currentPage(userBlocksPage.getNumber())
                .totalPages(userBlocksPage.getTotalPages())
                .totalElements(userBlocksPage.getTotalElements())
                .build();
    }

    /**
     * Extract blocked user from UserBlock for getBlockedUsers method
     */
    public static com.kaleidoscope.backend.users.model.User extractBlockedUser(UserBlock userBlock) {
        return userBlock.getBlocked();
    }

    /**
     * Extract blocker user from UserBlock for getUsersWhoBlockedMe method
     */
    public static com.kaleidoscope.backend.users.model.User extractBlockerUser(UserBlock userBlock) {
        return userBlock.getBlocker();
    }
}
