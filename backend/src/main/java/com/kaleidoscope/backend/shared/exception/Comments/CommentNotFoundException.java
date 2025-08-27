package com.kaleidoscope.backend.shared.exception.Comments;

public class CommentNotFoundException extends RuntimeException {
    public CommentNotFoundException(Long commentId) {
        super("Comment not found: " + commentId);
    }
}

