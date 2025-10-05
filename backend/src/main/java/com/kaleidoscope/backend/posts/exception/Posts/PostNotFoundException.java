package com.kaleidoscope.backend.posts.exception.Posts;

public class PostNotFoundException extends RuntimeException {
    public PostNotFoundException(Long postId) {
        super("Post not found with id: " + postId);
    }
}

