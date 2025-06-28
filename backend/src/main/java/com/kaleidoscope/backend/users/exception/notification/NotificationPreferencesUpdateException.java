package com.kaleidoscope.backend.users.exception.notification;

public class NotificationPreferencesUpdateException extends RuntimeException {
    public NotificationPreferencesUpdateException(String message) {
        super(message);
    }

    public NotificationPreferencesUpdateException(String message, Throwable cause) {
        super(message, cause);
    }
}
