// File: backend/src/main/java/com/dbms/mentalhealth/exception/JwtTokenExpiredException.java
package com.kaleidoscope.backend.auth.exception.token;

public class JwtTokenExpiredException extends RuntimeException {
    public JwtTokenExpiredException(String message) {
        super(message);
    }
}