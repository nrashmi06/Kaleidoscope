package com.kaleidoscope.backend.users.exception.userblock;

public class UserBlockNotFoundException extends RuntimeException {

    public UserBlockNotFoundException(String message) {
        super(message);
    }

    public UserBlockNotFoundException(Long blockerId, Long blockedId) {
        super(String.format("Block relationship not found between user %d and user %d", blockerId, blockedId));
    }
}
