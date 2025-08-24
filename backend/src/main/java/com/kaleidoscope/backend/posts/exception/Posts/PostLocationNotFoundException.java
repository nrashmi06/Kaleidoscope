package com.kaleidoscope.backend.posts.exception.Posts;

public class PostLocationNotFoundException extends RuntimeException {
    public PostLocationNotFoundException(Long locationId) {
        super("Location not found for id: " + locationId);
    }
}

