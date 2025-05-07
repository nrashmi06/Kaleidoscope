package com.kaleidoscope.backend.auth.exception.token;

public class MissingRequestCookieException extends RuntimeException {
    public MissingRequestCookieException(String message) {
        super(message);
    }
}
