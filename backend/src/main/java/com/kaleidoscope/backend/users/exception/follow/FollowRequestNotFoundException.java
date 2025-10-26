package com.kaleidoscope.backend.users.exception.follow;

public class FollowRequestNotFoundException extends RuntimeException {
    public FollowRequestNotFoundException(String message) {
        super(message);
    }
}

