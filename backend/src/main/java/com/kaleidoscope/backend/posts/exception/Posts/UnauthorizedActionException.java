package com.kaleidoscope.backend.posts.exception.Posts;

public class UnauthorizedActionException extends RuntimeException {
    public UnauthorizedActionException(String message) {
        super(message);
    }
    public UnauthorizedActionException(String message, Throwable cause) {
        super(message, cause);
    }
    public UnauthorizedActionException() {
        super("Unauthorized action.");
    }
}

