package com.kaleidoscope.backend.async.exception.async;

public class PostMediaNotFoundException extends RuntimeException {
    private final Long mediaId;

    public PostMediaNotFoundException(Long mediaId) {
        super(String.format("PostMedia not found for mediaId: %d", mediaId));
        this.mediaId = mediaId;
    }

    public Long getMediaId() {
        return mediaId;
    }
}

