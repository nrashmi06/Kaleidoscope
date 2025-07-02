package com.kaleidoscope.backend.users.exception.userinterest;

public class UserInterestAlreadyExistsException extends RuntimeException {
    public UserInterestAlreadyExistsException(String message) {
        super(message);
    }
}
