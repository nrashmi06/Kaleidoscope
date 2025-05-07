// File: src/main/java/hpe/energy_optimization_backend/exception/houseAndDevice/UnauthorizedAccessException.java
package com.kaleidoscope.backend.auth.exception.auth;

public class UnauthorizedAccessException extends RuntimeException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}
