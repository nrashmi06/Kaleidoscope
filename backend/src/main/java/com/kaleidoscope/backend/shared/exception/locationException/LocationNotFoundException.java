package com.kaleidoscope.backend.shared.exception.locationException;

public class LocationNotFoundException extends RuntimeException {
    public LocationNotFoundException(Long id) {
        super("Location not found with id: " + id);
    }

    public LocationNotFoundException(String message) {
        super(message);
    }
}
