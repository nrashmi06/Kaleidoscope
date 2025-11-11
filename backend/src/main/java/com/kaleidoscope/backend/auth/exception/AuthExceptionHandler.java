package com.kaleidoscope.backend.auth.exception;

import com.kaleidoscope.backend.auth.exception.auth.InvalidUserCredentialsException;
import com.kaleidoscope.backend.auth.exception.auth.UnauthorizedAccessException;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyInUseException;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyVerifiedException;
import com.kaleidoscope.backend.auth.exception.email.InvalidEmailException;
import com.kaleidoscope.backend.auth.exception.token.JwtTokenExpiredException;
import com.kaleidoscope.backend.auth.exception.token.RefreshTokenException;
import com.kaleidoscope.backend.shared.exception.Image.ImageStorageException;
import com.kaleidoscope.backend.shared.exception.other.UserNotFoundException;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.users.exception.user.InvalidUsernameException;
import com.kaleidoscope.backend.users.exception.user.UserAccountSuspendedException;
import com.kaleidoscope.backend.users.exception.user.UserNotActiveException;
import com.kaleidoscope.backend.users.exception.user.UsernameAlreadyInUseException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingRequestCookieException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice(basePackages = "com.kaleidoscope.backend.auth")
@Component("authExceptionHandler")
public class AuthExceptionHandler {

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<AppResponse<Object>> handleUnauthorizedAccessException(UnauthorizedAccessException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Unauthorized", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MissingRequestCookieException.class)
    public ResponseEntity<AppResponse<Object>> handleMissingRequestCookieException(MissingRequestCookieException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Missing cookie", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(EmailAlreadyVerifiedException.class)
    public ResponseEntity<AppResponse<Object>> handleEmailAlreadyVerifiedException(EmailAlreadyVerifiedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Email already verified", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(EmailAlreadyInUseException.class)
    public ResponseEntity<AppResponse<Object>> handleEmailAlreadyInUseException(EmailAlreadyInUseException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Email already in use", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidEmailException.class)
    public ResponseEntity<AppResponse<Object>> handleInvalidEmailException(InvalidEmailException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Invalid email", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RefreshTokenException.class)
    public ResponseEntity<AppResponse<Object>> handleRefreshTokenException(RefreshTokenException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Refresh token error", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidUserCredentialsException.class)
    public ResponseEntity<AppResponse<Object>> handleInvalidUserCredentialsException(InvalidUserCredentialsException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error(ex.getMessage(), ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(JwtTokenExpiredException.class)
    public ResponseEntity<AppResponse<Object>> handleJwtTokenExpiredException(JwtTokenExpiredException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Session expired", "Session expired. Please log in again.", path);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<AppResponse<Object>> handleAuthenticationException(org.springframework.security.core.AuthenticationException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Authentication failed", "Invalid email or password", path);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    // Registration-specific exceptions that need to be handled in auth package
    @ExceptionHandler(InvalidUsernameException.class)
    public ResponseEntity<AppResponse<Object>> handleInvalidUsernameException(InvalidUsernameException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Invalid username", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UsernameAlreadyInUseException.class)
    public ResponseEntity<AppResponse<Object>> handleUsernameAlreadyInUseException(UsernameAlreadyInUseException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Username already in use", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // Missing critical exceptions from auth services
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleUserNotFoundException(UserNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("User not found", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserNotActiveException.class)
    public ResponseEntity<AppResponse<Object>> handleUserNotActiveException(UserNotActiveException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Account not active", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(UserAccountSuspendedException.class)
    public ResponseEntity<AppResponse<Object>> handleUserAccountSuspendedException(UserAccountSuspendedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Account suspended", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleUsernameNotFoundException(UsernameNotFoundException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Authentication failed", "Invalid email or password", path);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AppResponse<Object>> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Invalid request", ex.getMessage(), path);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.mail.MailSendException.class)
    public ResponseEntity<AppResponse<Object>> handleMailSendException(org.springframework.mail.MailSendException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Email service error", "Failed to send email. Please try again later.", path);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(ImageStorageException.class)
    public ResponseEntity<AppResponse<Object>> handleImageStorageException(ImageStorageException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        AppResponse<Object> response = AppResponse.error("Image storage error", "Failed to store image. Please try again later.", path);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<AppResponse<Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        String supportedMethods = ex.getSupportedHttpMethods() != null
            ? String.join(", ", ex.getSupportedHttpMethods().stream().map(method -> method.name()).toList())
            : "Unknown";
        String errorMessage = String.format("HTTP method '%s' is not supported for this endpoint. Supported methods: %s",
            ex.getMethod(), supportedMethods);

        AppResponse<Object> response = AppResponse.error(
            "Method not allowed",
            errorMessage,
            path
        );
        return new ResponseEntity<>(response, HttpStatus.METHOD_NOT_ALLOWED);
    }
}