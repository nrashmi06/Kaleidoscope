package com.kaleidoscope.backend.blogs.exception;

import com.kaleidoscope.backend.blogs.exception.Blogs.BlogNotFoundException;
import com.kaleidoscope.backend.blogs.exception.Blogs.UnauthorizedBlogActionException;
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
