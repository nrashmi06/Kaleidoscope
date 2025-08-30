package com.kaleidoscope.backend.blogs.exception;

import com.kaleidoscope.backend.blogs.exception.Blogs.BlogNotFoundException;
import com.kaleidoscope.backend.blogs.exception.Blogs.UnauthorizedBlogActionException;
import com.kaleidoscope.backend.shared.exception.locationException.LocationNotFoundException;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "com.kaleidoscope.backend.blogs")
@Slf4j
public class BlogExceptionHandler {

    @ExceptionHandler(BlogNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleBlogNotFoundException(BlogNotFoundException ex) {
        log.error("Blog not found: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), ex.getMessage(), "");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(UnauthorizedBlogActionException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnauthorizedBlogActionException(UnauthorizedBlogActionException ex) {
        log.error("Unauthorized blog action: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), ex.getMessage(), "");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(LocationNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleLocationNotFoundException(LocationNotFoundException ex) {
        log.error("Location not found: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), ex.getMessage(), "");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
}
