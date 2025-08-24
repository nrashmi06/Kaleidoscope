package com.kaleidoscope.backend.posts.exception.Posts;

public class PostCategoryNotFoundException extends RuntimeException {
    public PostCategoryNotFoundException() {
        super("One or more categories not found for the post.");
    }
}

