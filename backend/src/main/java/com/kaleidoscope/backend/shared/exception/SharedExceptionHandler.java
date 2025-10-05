package com.kaleidoscope.backend.shared.exception;

import com.kaleidoscope.backend.shared.exception.Image.ImageStorageException;
import com.kaleidoscope.backend.shared.exception.Image.SignatureGenerationException;
import com.kaleidoscope.backend.shared.exception.categoryException.CategoryAlreadyExistsException;
import com.kaleidoscope.backend.shared.exception.categoryException.CategoryNotFoundException;
import com.kaleidoscope.backend.shared.exception.userTags.TagNotFoundException;
import com.kaleidoscope.backend.shared.exception.userTags.UserTaggingException;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice(basePackages = "com.kaleidoscope.backend.shared")
@Component("sharedExceptionHandler")
public class SharedExceptionHandler {

    @ExceptionHandler(ImageStorageException.class)
    public ResponseEntity<ApiResponse<Object>> handleImageStorageException(ImageStorageException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(
                "Image storage error",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(SignatureGenerationException.class)
    public ResponseEntity<ApiResponse<Object>> handleSignatureGenerationException(SignatureGenerationException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(
                "Signature generation error",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleCategoryNotFoundException(CategoryNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(
                "Category not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(CategoryAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Object>> handleCategoryAlreadyExistsException(CategoryAlreadyExistsException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(
                "Category already exists",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.locationException.LocationNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleLocationNotFoundException(com.kaleidoscope.backend.shared.exception.locationException.LocationNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(
                "Location not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(com.kaleidoscope.backend.shared.exception.locationException.LocationAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Object>> handleLocationAlreadyExistsException(com.kaleidoscope.backend.shared.exception.locationException.LocationAlreadyExistsException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(
                "Location already exists",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        String errorMessage = "Method not allowed: " + ex.getMethod() + " is not supported for this endpoint. Supported methods are: " +
                String.join(", ", ex.getSupportedMethods());

        ApiResponse<Object> response = ApiResponse.error(
                "Method not allowed",
                errorMessage,
                path
        );
        return new ResponseEntity<>(response, HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(
                "An unexpected error occurred",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // User Tagging Exception Handlers
    @ExceptionHandler(TagNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleTagNotFoundException(TagNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(
                "Tag not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserTaggingException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserTaggingException(UserTaggingException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(
                "User tagging error",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}