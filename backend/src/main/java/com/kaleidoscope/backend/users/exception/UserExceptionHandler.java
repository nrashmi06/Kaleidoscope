package com.kaleidoscope.backend.users.exception;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.exception.notification.NotificationPreferencesUpdateException;
import com.kaleidoscope.backend.users.exception.notification.UserNotificationPreferencesNotFoundException;
import com.kaleidoscope.backend.users.exception.user.*;
import com.kaleidoscope.backend.users.exception.userblock.SelfBlockNotAllowedException;
import com.kaleidoscope.backend.users.exception.userblock.UserAlreadyBlockedException;
import com.kaleidoscope.backend.users.exception.userblock.UserBlockNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

import java.util.List;

@RestControllerAdvice(basePackages = "com.kaleidoscope.backend.users")
@Slf4j
public class UserExceptionHandler {

    // Notification Preferences Exception Handlers
    @ExceptionHandler(UserNotificationPreferencesNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserNotificationPreferencesNotFoundException(
            UserNotificationPreferencesNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("UserNotificationPreferencesNotFoundException caught by UserExceptionHandler: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "Notification preferences not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(NotificationPreferencesUpdateException.class)
    public ResponseEntity<ApiResponse<Object>> handleNotificationPreferencesUpdateException(
            NotificationPreferencesUpdateException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("NotificationPreferencesUpdateException caught by UserExceptionHandler: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "Failed to update notification preferences",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Access Control Exception Handlers
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(
            org.springframework.security.access.AccessDeniedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("AccessDeniedException caught by UserExceptionHandler: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "Access denied",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    // Validation Exception Handlers
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodArgumentNotValidException(
            org.springframework.web.bind.MethodArgumentNotValidException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("MethodArgumentNotValidException caught by UserExceptionHandler: {}", ex.getMessage());

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(java.util.stream.Collectors.toList());

        ApiResponse<Object> response = ApiResponse.error(
                "Validation failed",
                errors,
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraintViolationException(
            jakarta.validation.ConstraintViolationException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("ConstraintViolationException caught by UserExceptionHandler: {}", ex.getMessage());

        List<String> errors = ex.getConstraintViolations()
                .stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .collect(java.util.stream.Collectors.toList());

        ApiResponse<Object> response = ApiResponse.error(
                "Validation constraint violated",
                errors,
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // UserBlock Exception Handlers - Put these FIRST for highest priority
    @ExceptionHandler(UserBlockNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserBlockNotFoundException(UserBlockNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("UserBlockNotFoundException caught by UserExceptionHandler: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "Block relationship not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserAlreadyBlockedException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserAlreadyBlockedException(UserAlreadyBlockedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("UserAlreadyBlockedException caught by UserExceptionHandler: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "User already blocked",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(SelfBlockNotAllowedException.class)
    public ResponseEntity<ApiResponse<Object>> handleSelfBlockNotAllowedException(SelfBlockNotAllowedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("SelfBlockNotAllowedException caught by UserExceptionHandler: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "Self-blocking not allowed",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // User Exception Handlers
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserNotFoundException(UserNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("User not found: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "User not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserPreferencesNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserPreferencesNotFoundException(UserPreferencesNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("User preferences not found: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "User preferences not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserNotActiveException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserNotActiveException(UserNotActiveException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("User account not active: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "User account not active",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(UsernameAlreadyInUseException.class)
    public ResponseEntity<ApiResponse<Object>> handleUsernameAlreadyInUseException(UsernameAlreadyInUseException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("Username already in use: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "Username already in use",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(UserAccountSuspendedException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserAccountSuspendedException(UserAccountSuspendedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("User account suspended: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "User account suspended",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(InvalidUsernameException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidUsernameException(InvalidUsernameException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("Invalid username: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(
                "Invalid username",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}