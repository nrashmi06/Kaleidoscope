package com.kaleidoscope.backend.blogs.exception;

public class BlogNotFoundException extends RuntimeException {
    public BlogNotFoundException(Long blogId) {
        super("Blog not found with ID: " + blogId);
    }
}
