package com.kaleidoscope.backend.shared.exception;

import com.kaleidoscope.backend.shared.exception.Image.ImageStorageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

@RestControllerAdvice
public class CustomExceptionHandler {
    @ExceptionHandler(ImageStorageException.class)
    public ResponseEntity<String> handleImageStorageException(ImageStorageException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
    }
}