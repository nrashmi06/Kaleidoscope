package com.kaleidoscope.backend.users.exception.userblock;

public class SelfBlockNotAllowedException extends RuntimeException {

    public SelfBlockNotAllowedException() {
        super("Users cannot block themselves");
    }

    public SelfBlockNotAllowedException(String message) {
        super(message);
    }
}
