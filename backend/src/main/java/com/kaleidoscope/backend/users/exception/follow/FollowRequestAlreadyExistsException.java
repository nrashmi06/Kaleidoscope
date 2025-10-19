package com.kaleidoscope.backend.users.exception.follow;

public class FollowRequestAlreadyExistsException extends RuntimeException {
    public FollowRequestAlreadyExistsException(String message) {
        super(message);
    }
}

