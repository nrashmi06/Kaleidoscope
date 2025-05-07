package com.kaleidoscope.backend.auth.exception.user;

public class UsernameAlreadyInUseException extends RuntimeException{
    public UsernameAlreadyInUseException(String message) {
        super(message);
    }
}
