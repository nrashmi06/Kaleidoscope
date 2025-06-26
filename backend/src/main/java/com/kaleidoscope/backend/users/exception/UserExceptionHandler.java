package com.kaleidoscope.backend.users.exception;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.exception.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice
@Component("userExceptionHandler")
public class UserExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserNotFoundException(UserNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
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
        ApiResponse<Object> response = ApiResponse.error(
                "Invalid username",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // Generic handler for any other RuntimeException in user module
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericRuntimeException(RuntimeException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();

        // Only handle if the exception is from the user package
        if (ex.getClass().getPackage().getName().contains("com.kaleidoscope.backend.users")) {
            ApiResponse<Object> response = ApiResponse.error(
                    "User operation failed",
                    ex.getMessage(),
                    path
            );
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Re-throw if not from user package to let other handlers deal with it
        throw ex;
    }
}
