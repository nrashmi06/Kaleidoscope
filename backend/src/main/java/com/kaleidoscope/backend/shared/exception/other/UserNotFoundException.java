package com.kaleidoscope.backend.shared.exception.other;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
}