package com.kaleidoscope.backend.posts.exception;

import com.kaleidoscope.backend.posts.exception.Posts.*;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice(basePackages = "com.kaleidoscope.backend.posts")
public class PostExceptionHandler {

    @ExceptionHandler(PostNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handlePostNotFound(PostNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Post not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(PostCategoryNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleCategoryNotFound(PostCategoryNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Category not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(PostLocationNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleLocationNotFound(PostLocationNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Location not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InvalidPostMediaException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidMedia(InvalidPostMediaException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Invalid media", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalState(IllegalStateException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Invalid state", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(UnauthorizedActionException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnauthorizedAction(com.kaleidoscope.backend.posts.exception.Posts.UnauthorizedActionException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Unauthorized action", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(IllegalStatePostActionException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalStatePostAction(IllegalStatePostActionException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Illegal state for post action", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.Comments.CommentNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleCommentNotFound(com.kaleidoscope.backend.shared.exception.Comments.CommentNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Comment not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.Comments.CommentPostMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleCommentPostMismatch(com.kaleidoscope.backend.shared.exception.Comments.CommentPostMismatchException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Comment does not belong to specified post", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.Comments.CommentUnauthorizedException.class)
    public ResponseEntity<ApiResponse<Object>> handleCommentUnauthorized(com.kaleidoscope.backend.shared.exception.Comments.CommentUnauthorizedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Not authorized to delete comment", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.other.ContentNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleContentNotFoundException(com.kaleidoscope.backend.shared.exception.other.ContentNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Content not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }
}
