package com.kaleidoscope.backend.shared.exception.locationException;

public class LocationAlreadyExistsException extends RuntimeException {
    public LocationAlreadyExistsException(String message) {
        super(message);
    }
    
    public LocationAlreadyExistsException(String field, String value) {
        super("Location already exists with " + field + ": " + value);
    }
}
