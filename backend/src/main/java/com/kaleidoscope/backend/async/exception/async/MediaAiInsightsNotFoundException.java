package com.kaleidoscope.backend.async.exception.async;

public class MediaAiInsightsNotFoundException extends RuntimeException {
    private final Long mediaId;

    public MediaAiInsightsNotFoundException(Long mediaId) {
        super(String.format("MediaAiInsights not found for mediaId: %d", mediaId));
        this.mediaId = mediaId;
    }

    public Long getMediaId() {
        return mediaId;
    }
}

