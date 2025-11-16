package com.kaleidoscope.backend.blogs.exception;

import com.kaleidoscope.backend.blogs.exception.Blogs.BlogNotFoundException;
import com.kaleidoscope.backend.blogs.exception.Blogs.UnauthorizedBlogActionException;
import com.kaleidoscope.backend.shared.exception.Comments.CommentNotFoundException;
import com.kaleidoscope.backend.shared.exception.Comments.CommentPostMismatchException;
import com.kaleidoscope.backend.shared.exception.Comments.CommentUnauthorizedException;
import com.kaleidoscope.backend.shared.exception.categoryException.CategoryNotFoundException;
import com.kaleidoscope.backend.shared.exception.locationException.LocationNotFoundException;
import com.kaleidoscope.backend.shared.response.AppResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.kaleidoscope.backend.blogs")
@Slf4j
public class BlogExceptionHandler {

    @ExceptionHandler(BlogNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleBlogNotFoundException(BlogNotFoundException ex) {
        log.error("Blog not found: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(ex.getMessage(), ex.getMessage(), "");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.other.ContentNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleContentNotFoundException(
            com.kaleidoscope.backend.shared.exception.other.ContentNotFoundException ex) {
        log.error("Content not found for blog interaction: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
            "Content not found",
            "The blog you're trying to interact with does not exist or has been removed",
            ""
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(CommentNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleCommentNotFoundException(CommentNotFoundException ex) {
        log.error("Comment not found: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
            "Comment not found",
            "The comment you're trying to access does not exist",
            ""
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(CommentPostMismatchException.class)
    public ResponseEntity<AppResponse<Object>> handleCommentPostMismatchException(CommentPostMismatchException ex) {
        log.error("Comment-blog mismatch: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
            "Invalid request",
            "The comment does not belong to this blog",
            ""
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(CommentUnauthorizedException.class)
    public ResponseEntity<AppResponse<Object>> handleCommentUnauthorizedException(CommentUnauthorizedException ex) {
        log.error("Unauthorized comment action: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
            "Unauthorized",
            "You are not authorized to perform this action on this comment",
            ""
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(UnauthorizedBlogActionException.class)
    public ResponseEntity<AppResponse<Object>> handleUnauthorizedBlogActionException(UnauthorizedBlogActionException ex) {
        log.error("Unauthorized blog action: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(ex.getMessage(), ex.getMessage(), "");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(LocationNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleLocationNotFoundException(LocationNotFoundException ex) {
        log.error("Location not found: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(ex.getMessage(), ex.getMessage(), "");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleCategoryNotFoundException(CategoryNotFoundException ex) {
        log.error("Category not found during blog operation: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error("Invalid categories", ex.getMessage(), "");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AppResponse<Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("Invalid argument in blog operation: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error("Invalid request", ex.getMessage(), "");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<AppResponse<Object>> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        log.error("Malformed JSON request for blog operation: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error("Invalid request format", "Request body is missing or malformed JSON", "");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AppResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        log.error("Validation failed for blog request: {}", ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );

        String errorMessage = "Validation failed: " + errors.toString();
        AppResponse<Object> response = AppResponse.error("Validation failed", errorMessage, "");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
