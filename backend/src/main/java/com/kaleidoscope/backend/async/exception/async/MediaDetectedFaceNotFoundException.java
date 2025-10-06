package com.kaleidoscope.backend.async.exception.async;

public class MediaDetectedFaceNotFoundException extends RuntimeException {
    private final Long faceId;

    public MediaDetectedFaceNotFoundException(Long faceId) {
        super(String.format("MediaDetectedFace not found for faceId: %d", faceId));
        this.faceId = faceId;
    }

    public Long getFaceId() {
        return faceId;
    }
}

