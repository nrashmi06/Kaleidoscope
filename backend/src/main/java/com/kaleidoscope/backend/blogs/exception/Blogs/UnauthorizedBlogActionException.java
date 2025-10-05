package com.kaleidoscope.backend.blogs.exception.Blogs;

public class UnauthorizedBlogActionException extends RuntimeException {
    public UnauthorizedBlogActionException(String message) {
        super(message);
    }
}
