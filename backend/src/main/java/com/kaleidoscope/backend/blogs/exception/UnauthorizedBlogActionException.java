package com.kaleidoscope.backend.blogs.exception;

public class UnauthorizedBlogActionException extends RuntimeException {
    public UnauthorizedBlogActionException(String message) {
        super(message);
    }
}
