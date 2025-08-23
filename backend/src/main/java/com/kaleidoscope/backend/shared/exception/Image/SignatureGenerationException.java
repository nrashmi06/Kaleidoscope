package com.kaleidoscope.backend.shared.exception.Image;

public class SignatureGenerationException extends RuntimeException {
    public SignatureGenerationException(String message) {
        super(message);
    }

    public SignatureGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}