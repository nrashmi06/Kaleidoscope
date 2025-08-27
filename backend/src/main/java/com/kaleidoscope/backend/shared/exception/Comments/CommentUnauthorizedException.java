package com.kaleidoscope.backend.shared.exception.Comments;

public class CommentUnauthorizedException extends RuntimeException {
    public CommentUnauthorizedException(Long commentId) {
        super("Not authorized to delete comment: " + commentId);
    }
}

