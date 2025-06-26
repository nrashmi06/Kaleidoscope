package com.kaleidoscope.backend.users.exception.user;

public class UserPreferencesNotFoundException extends RuntimeException {
    public UserPreferencesNotFoundException(String message) {
        super(message);
    }

    public UserPreferencesNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
