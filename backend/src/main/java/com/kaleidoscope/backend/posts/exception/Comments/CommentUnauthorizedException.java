package com.kaleidoscope.backend.posts.exception.Comments;

public class CommentUnauthorizedException extends RuntimeException {
    public CommentUnauthorizedException(Long commentId) {
        super("Not authorized to delete comment: " + commentId);
    }
}

