package com.kaleidoscope.backend.posts.exception;

import com.kaleidoscope.backend.posts.exception.Posts.*;
import com.kaleidoscope.backend.shared.response.AppResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice(basePackages = "com.kaleidoscope.backend.posts")
public class PostExceptionHandler {

    @ExceptionHandler(PostNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handlePostNotFound(PostNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Post not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(PostCategoryNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleCategoryNotFound(PostCategoryNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Category not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(PostLocationNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleLocationNotFound(PostLocationNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Location not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InvalidPostMediaException.class)
    public ResponseEntity<AppResponse<Object>> handleInvalidMedia(InvalidPostMediaException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Invalid media", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<AppResponse<Object>> handleIllegalState(IllegalStateException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Invalid state", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(UnauthorizedActionException.class)
    public ResponseEntity<AppResponse<Object>> handleUnauthorizedAction(com.kaleidoscope.backend.posts.exception.Posts.UnauthorizedActionException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Unauthorized action", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(IllegalStatePostActionException.class)
    public ResponseEntity<AppResponse<Object>> handleIllegalStatePostAction(IllegalStatePostActionException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Illegal state for post action", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.Comments.CommentNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleCommentNotFound(com.kaleidoscope.backend.shared.exception.Comments.CommentNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Comment not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.Comments.CommentPostMismatchException.class)
    public ResponseEntity<AppResponse<Object>> handleCommentPostMismatch(com.kaleidoscope.backend.shared.exception.Comments.CommentPostMismatchException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Comment does not belong to specified post", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.Comments.CommentUnauthorizedException.class)
    public ResponseEntity<AppResponse<Object>> handleCommentUnauthorized(com.kaleidoscope.backend.shared.exception.Comments.CommentUnauthorizedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Not authorized to delete comment", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.other.ContentNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleContentNotFoundException(com.kaleidoscope.backend.shared.exception.other.ContentNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Content not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }
}
