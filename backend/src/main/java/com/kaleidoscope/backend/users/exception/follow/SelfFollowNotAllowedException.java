package com.kaleidoscope.backend.users.exception.follow;

public class SelfFollowNotAllowedException extends RuntimeException {
    public SelfFollowNotAllowedException(String message) {
        super(message);
    }
}
