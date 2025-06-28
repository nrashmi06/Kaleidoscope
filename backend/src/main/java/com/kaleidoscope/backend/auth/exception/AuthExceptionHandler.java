package com.kaleidoscope.backend.auth.exception;

import com.kaleidoscope.backend.auth.exception.auth.InvalidUserCredentialsException;
import com.kaleidoscope.backend.auth.exception.auth.UnauthorizedAccessException;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyInUseException;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyVerifiedException;
import com.kaleidoscope.backend.auth.exception.email.InvalidEmailException;
import com.kaleidoscope.backend.auth.exception.token.JwtTokenExpiredException;
import com.kaleidoscope.backend.auth.exception.token.RefreshTokenException;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.exception.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.MissingRequestCookieException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@RestControllerAdvice(basePackages = "com.kaleidoscope.backend.auth")
@Component("authExceptionHandler")
public class AuthExceptionHandler {

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnauthorizedAccessException(UnauthorizedAccessException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Unauthorized", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(UserNotActiveException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserNotActiveException(UserNotActiveException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Account not active", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(MissingRequestCookieException.class)
    public ResponseEntity<ApiResponse<Object>> handleMissingRequestCookieException(MissingRequestCookieException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Missing cookie", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UsernameAlreadyInUseException.class)
    public ResponseEntity<ApiResponse<Object>> handleUsernameAlreadyInUseException(UsernameAlreadyInUseException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Username already in use", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidUsernameException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidUsernameException(InvalidUsernameException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Invalid username", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(EmailAlreadyVerifiedException.class)
    public ResponseEntity<ApiResponse<Object>> handleEmailAlreadyVerifiedException(EmailAlreadyVerifiedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Email already verified", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(EmailAlreadyInUseException.class)
    public ResponseEntity<ApiResponse<Object>> handleEmailAlreadyInUseException(EmailAlreadyInUseException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Email already in use", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UserAccountSuspendedException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserAccountSuspendedException(UserAccountSuspendedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Account suspended", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleUsernameNotFoundException(UsernameNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidEmailException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidEmailException(InvalidEmailException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Invalid email", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RefreshTokenException.class)
    public ResponseEntity<ApiResponse<Object>> handleRefreshTokenException(RefreshTokenException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Refresh token error", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidUserCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidUserCredentialsException(InvalidUserCredentialsException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(JwtTokenExpiredException.class)
    public ResponseEntity<ApiResponse<Object>> handleJwtTokenExpiredException(JwtTokenExpiredException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("Session expired", "Session expired. Please log in again.", path);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserNotFoundException(UserNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ApiResponse<Object> response = ApiResponse.error("User not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }
}