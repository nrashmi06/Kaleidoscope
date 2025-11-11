package com.kaleidoscope.backend.users.exception;

import com.kaleidoscope.backend.shared.exception.other.UserNotFoundException;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.users.exception.follow.*;
import com.kaleidoscope.backend.users.exception.notification.NotificationPreferencesUpdateException;
import com.kaleidoscope.backend.users.exception.notification.UserNotificationPreferencesNotFoundException;
import com.kaleidoscope.backend.users.exception.user.*;
import com.kaleidoscope.backend.users.exception.userblock.SelfBlockNotAllowedException;
import com.kaleidoscope.backend.users.exception.userblock.UserAlreadyBlockedException;
import com.kaleidoscope.backend.users.exception.userblock.UserBlockNotFoundException;
import com.kaleidoscope.backend.users.exception.userinterest.UserInterestAlreadyExistsException;
import com.kaleidoscope.backend.users.exception.userinterest.UserInterestNotFoundException;
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
    public ResponseEntity<AppResponse<Object>> handleUserNotificationPreferencesNotFoundException(
            UserNotificationPreferencesNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("UserNotificationPreferencesNotFoundException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Notification preferences not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(NotificationPreferencesUpdateException.class)
    public ResponseEntity<AppResponse<Object>> handleNotificationPreferencesUpdateException(
            NotificationPreferencesUpdateException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("NotificationPreferencesUpdateException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Failed to update notification preferences",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Access Control Exception Handlers
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<AppResponse<Object>> handleAccessDeniedException(
            org.springframework.security.access.AccessDeniedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("AccessDeniedException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Access denied",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    // Validation Exception Handlers
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<AppResponse<Object>> handleMethodArgumentNotValidException(
            org.springframework.web.bind.MethodArgumentNotValidException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("MethodArgumentNotValidException caught by UserExceptionHandler: {}", ex.getMessage());

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(java.util.stream.Collectors.toList());

        AppResponse<Object> response = AppResponse.error(
                "Validation failed",
                errors,
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<AppResponse<Object>> handleConstraintViolationException(
            jakarta.validation.ConstraintViolationException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("ConstraintViolationException caught by UserExceptionHandler: {}", ex.getMessage());

        List<String> errors = ex.getConstraintViolations()
                .stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .collect(java.util.stream.Collectors.toList());

        AppResponse<Object> response = AppResponse.error(
                "Validation constraint violated",
                errors,
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // UserBlock Exception Handlers - Put these FIRST for highest priority
    @ExceptionHandler(UserBlockNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleUserBlockNotFoundException(UserBlockNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("UserBlockNotFoundException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Block relationship not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserAlreadyBlockedException.class)
    public ResponseEntity<AppResponse<Object>> handleUserAlreadyBlockedException(UserAlreadyBlockedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("UserAlreadyBlockedException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "User already blocked",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(SelfBlockNotAllowedException.class)
    public ResponseEntity<AppResponse<Object>> handleSelfBlockNotAllowedException(SelfBlockNotAllowedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("SelfBlockNotAllowedException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Self-blocking not allowed",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // User Exception Handlers
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleUserNotFoundException(UserNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("User not found: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "User not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserPreferencesNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleUserPreferencesNotFoundException(UserPreferencesNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("User preferences not found: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "User preferences not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserNotActiveException.class)
    public ResponseEntity<AppResponse<Object>> handleUserNotActiveException(UserNotActiveException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("User account not active: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "User account not active",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(UsernameAlreadyInUseException.class)
    public ResponseEntity<AppResponse<Object>> handleUsernameAlreadyInUseException(UsernameAlreadyInUseException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("Username already in use: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Username already in use",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(UserAccountSuspendedException.class)
    public ResponseEntity<AppResponse<Object>> handleUserAccountSuspendedException(UserAccountSuspendedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("User account suspended: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "User account suspended",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(InvalidUsernameException.class)
    public ResponseEntity<AppResponse<Object>> handleInvalidUsernameException(InvalidUsernameException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.warn("Invalid username: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Invalid username",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // Follow Exception Handlers
    @ExceptionHandler(FollowRelationshipNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleFollowRelationshipNotFoundException(FollowRelationshipNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("FollowRelationshipNotFoundException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Follow relationship not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserAlreadyFollowedException.class)
    public ResponseEntity<AppResponse<Object>> handleUserAlreadyFollowedException(UserAlreadyFollowedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("UserAlreadyFollowedException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "User already followed",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(SelfFollowNotAllowedException.class)
    public ResponseEntity<AppResponse<Object>> handleSelfFollowNotAllowedException(SelfFollowNotAllowedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("SelfFollowNotAllowedException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Self-following not allowed",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(FollowRequestNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleFollowRequestNotFoundException(FollowRequestNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("FollowRequestNotFoundException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Follow request not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(FollowRequestAlreadyExistsException.class)
    public ResponseEntity<AppResponse<Object>> handleFollowRequestAlreadyExistsException(FollowRequestAlreadyExistsException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("FollowRequestAlreadyExistsException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Follow request already exists",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    // UserInterest Exception Handlers
    @ExceptionHandler(UserInterestNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleUserInterestNotFoundException(UserInterestNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("UserInterestNotFoundException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "User interest not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserInterestAlreadyExistsException.class)
    public ResponseEntity<AppResponse<Object>> handleUserInterestAlreadyExistsException(UserInterestAlreadyExistsException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("UserInterestAlreadyExistsException caught by UserExceptionHandler: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "User interest already exists",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    // Generic Exception Handler for Users Package
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<AppResponse<Object>> handleRuntimeException(RuntimeException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("RuntimeException caught by UserExceptionHandler: {}", ex.getMessage(), ex);
        AppResponse<Object> response = AppResponse.error(
                "An error occurred",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<AppResponse<Object>> handleGenericException(Exception ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        log.error("Generic Exception caught by UserExceptionHandler: {}", ex.getMessage(), ex);
        AppResponse<Object> response = AppResponse.error(
                "An unexpected error occurred",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}