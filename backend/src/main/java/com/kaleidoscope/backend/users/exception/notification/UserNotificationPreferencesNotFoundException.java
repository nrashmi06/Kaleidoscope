package com.kaleidoscope.backend.users.exception.notification;

public class UserNotificationPreferencesNotFoundException extends RuntimeException {
    public UserNotificationPreferencesNotFoundException(String message) {
        super(message);
    }

    public UserNotificationPreferencesNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
