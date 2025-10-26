package com.kaleidoscope.backend.shared.exception.other;

public class HashTagNotFoundException extends RuntimeException {
    
    public HashTagNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
    
    public HashTagNotFoundException(String message) {
        super(message);
    }
}

