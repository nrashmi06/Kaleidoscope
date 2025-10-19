package com.kaleidoscope.backend.notifications.exception;

import com.kaleidoscope.backend.shared.response.AppResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice
@Slf4j
public class NotificationExceptionHandler {

    @ExceptionHandler(NotificationNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleNotificationNotFoundException(
            NotificationNotFoundException ex, WebRequest request) {
        
        log.error("NotificationNotFoundException: {}", ex.getMessage());
        
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(AppResponse.error(
                        "Notification not found",
                        ex.getMessage(),
                        request.getDescription(false).replace("uri=", "")
                ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<AppResponse<Object>> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {
        
        log.warn("AccessDeniedException in NotificationExceptionHandler: {}", ex.getMessage());
        
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(AppResponse.error(
                        "Access denied",
                        ex.getMessage(),
                        request.getDescription(false).replace("uri=", "")
                ));
    }
}

