package com.kaleidoscope.backend.blogs.exception.Blogs;

public class BlogNotFoundException extends RuntimeException {
    public BlogNotFoundException(Long blogId) {
        super("Blog not found with ID: " + blogId);
    }
}
