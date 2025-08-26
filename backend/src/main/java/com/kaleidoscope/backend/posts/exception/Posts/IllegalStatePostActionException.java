package com.kaleidoscope.backend.posts.exception.Posts;

public class IllegalStatePostActionException extends RuntimeException {
    public IllegalStatePostActionException(String message) {
        super(message);
    }
    public IllegalStatePostActionException(String message, Throwable cause) {
        super(message, cause);
    }
    public IllegalStatePostActionException() {
        super("Illegal state for post action.");
    }
}

