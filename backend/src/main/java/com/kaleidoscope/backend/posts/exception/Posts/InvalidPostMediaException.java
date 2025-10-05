package com.kaleidoscope.backend.posts.exception.Posts;

public class InvalidPostMediaException extends RuntimeException {
    public InvalidPostMediaException(String url) {
        super("Invalid or untrusted media URL: " + url);
    }
}

