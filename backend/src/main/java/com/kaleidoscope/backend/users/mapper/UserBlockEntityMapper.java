package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserBlock;
import org.springframework.stereotype.Component;

@Component
public class UserBlockEntityMapper {

    /**
     * Build UserBlock entity from users
     * Centralizes the entity creation logic
     */
    public UserBlock buildUserBlock(User blocker, User blocked) {
        return UserBlock.builder()
                .blocker(blocker)
                .blocked(blocked)
                .build();
    }

    /**
     * Validate that user is not attempting to block themselves
     */
    public void validateNotSelfBlock(Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new com.kaleidoscope.backend.users.exception.userblock.SelfBlockNotAllowedException();
        }
    }

    /**
     * Check if block already exists and throw exception if it does
     */
    public void validateBlockDoesNotExist(java.util.Optional<UserBlock> existingBlock, Long blockerUserId, Long blockedUserId) {
        if (existingBlock.isPresent()) {
            throw new com.kaleidoscope.backend.users.exception.userblock.UserAlreadyBlockedException(blockerUserId, blockedUserId);
        }
    }

    /**
     * Get existing block or throw exception if not found
     */
    public UserBlock getExistingBlockOrThrow(java.util.Optional<UserBlock> blockOptional, Long blockerUserId, Long blockedUserId) {
        return blockOptional.orElseThrow(() ->
            new com.kaleidoscope.backend.users.exception.userblock.UserBlockNotFoundException(blockerUserId, blockedUserId));
    }
}
