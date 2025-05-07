package com.kaleidoscope.backend.users.exception.user;

public class UsernameAlreadyInUseException extends RuntimeException{
    public UsernameAlreadyInUseException(String message) {
        super(message);
    }
}
