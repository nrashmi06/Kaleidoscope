package com.kaleidoscope.backend.users.exception.userblock;

public class UserAlreadyBlockedException extends RuntimeException {

    public UserAlreadyBlockedException(String message) {
        super(message);
    }

    public UserAlreadyBlockedException(Long blockerId, Long blockedId) {
        super(String.format("User %d has already blocked user %d", blockerId, blockedId));
    }
}
