package com.kaleidoscope.backend.users.exception.follow;

public class UserAlreadyFollowedException extends RuntimeException {
    public UserAlreadyFollowedException(String message) {
        super(message);
    }
}