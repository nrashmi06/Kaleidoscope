package com.kaleidoscope.backend.shared.exception.userTags;

public class UserTaggingException extends RuntimeException {
    public UserTaggingException(String message) {
        super(message);
    }

    public UserTaggingException(String message, Throwable cause) {
        super(message, cause);
    }
}
