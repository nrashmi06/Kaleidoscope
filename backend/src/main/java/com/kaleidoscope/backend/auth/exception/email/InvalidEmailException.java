package com.kaleidoscope.backend.auth.exception.email;

public class InvalidEmailException extends RuntimeException {
    public InvalidEmailException(String message) {
        super(message);
    }
}