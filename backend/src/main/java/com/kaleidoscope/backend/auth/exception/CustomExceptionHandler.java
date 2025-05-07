package com.kaleidoscope.backend.auth.exception;

import com.kaleidoscope.backend.auth.exception.token.JwtTokenExpiredException;
import com.kaleidoscope.backend.auth.exception.token.RefreshTokenException;
import com.kaleidoscope.backend.auth.exception.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingRequestCookieException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class CustomExceptionHandler {

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<String> handleUnauthorizedAccessException(UnauthorizedAccessException ex){
        return createErrorResponse(ex.getMessage(),HttpStatus.UNAUTHORIZED);
    }


    @ExceptionHandler(UserNotActiveException.class)
    public ResponseEntity<String> handleUserNotActiveException(UserNotActiveException ex) {
        return createErrorResponse(ex.getMessage(), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(MissingRequestCookieException.class)
    public ResponseEntity<String> handleMissingRequestCookieException(MissingRequestCookieException ex) {
        return createErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UsernameAlreadyInUseException.class)
    public ResponseEntity<String> handleUsernameAlreadyInUseException(UsernameAlreadyInUseException ex) {
        return createErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidUsernameException.class)
    public ResponseEntity<String> handleInvalidUsernameException(InvalidUsernameException ex) {
        return createErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(EmailAlreadyInUseException.class)
    public ResponseEntity<String> handleEmailAlreadyInUseException(EmailAlreadyInUseException ex) {
        return createErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }
    @ExceptionHandler(UserAccountSuspendedException.class)
    public ResponseEntity<String> handleUserAccountSuspendedException(UserAccountSuspendedException ex) {
        return createErrorResponse(ex.getMessage(), HttpStatus.FORBIDDEN);
    }
    @ExceptionHandler(InvalidEmailException.class)
    public ResponseEntity<String> handleInvalidEmailException(InvalidEmailException ex) {
        return createErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }
    @ExceptionHandler(RefreshTokenException.class)
    public ResponseEntity<String> handleRefreshTokenException(RefreshTokenException ex) {
        return createErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidUserCredentialsException.class)
    public ResponseEntity<String> handleInvalidUserCredentialsException(InvalidUserCredentialsException ex) {
        return createErrorResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED);
    }
    // Authentication & Authorization Exceptions
    @ExceptionHandler(JwtTokenExpiredException.class)
    public ResponseEntity<String> handleJwtTokenExpiredException(JwtTokenExpiredException ex) {
        return createErrorResponse("Session expired. Please log in again.", HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleUserNotFoundException(UserNotFoundException ex) {
        return createErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND);
    }
    // Helper method to create consistent error responses
    private ResponseEntity<String> createErrorResponse(String message, HttpStatus status) {
        return new ResponseEntity<>(message, status);
    }
}