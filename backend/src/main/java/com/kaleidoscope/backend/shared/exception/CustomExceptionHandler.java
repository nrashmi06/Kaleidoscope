package com.kaleidoscope.backend.shared.exception;

import com.kaleidoscope.backend.shared.exception.Image.ImageStorageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Component("sharedExceptionHandler")
public class CustomExceptionHandler {
    @ExceptionHandler(ImageStorageException.class)
    public ResponseEntity<String> handleImageStorageException(ImageStorageException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                "Method not allowed: " + ex.getMethod() + " is not supported for this endpoint. Supported methods are: " +
                        String.join(", ", ex.getSupportedMethods()),
                System.currentTimeMillis()
        );
        return new ResponseEntity<>(error, HttpStatus.METHOD_NOT_ALLOWED);
    }
}