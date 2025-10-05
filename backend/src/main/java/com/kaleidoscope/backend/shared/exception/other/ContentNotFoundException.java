package com.kaleidoscope.backend.shared.exception.other;

public class ContentNotFoundException extends RuntimeException {
    private final Long contentId;

    public ContentNotFoundException(Long contentId) {
        super("Content not found for ID: " + contentId);
        this.contentId = contentId;
    }

    public ContentNotFoundException(Long contentId, String message) {
        super(message);
        this.contentId = contentId;
    }

    public Long getContentId() {
        return contentId;
    }
}

