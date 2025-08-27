package com.kaleidoscope.backend.shared.exception.Comments;

public class CommentPostMismatchException extends RuntimeException {
    public CommentPostMismatchException(Long commentId, Long postId) {
        super("Comment " + commentId + " does not belong to post " + postId);
    }
}

