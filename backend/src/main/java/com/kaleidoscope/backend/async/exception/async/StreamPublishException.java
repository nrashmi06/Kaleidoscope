package com.kaleidoscope.backend.async.exception.async;

public class StreamPublishException extends RuntimeException {
    private final String streamName;

    public StreamPublishException(String streamName, String message) {
        super(String.format("Failed to publish to stream '%s': %s", streamName, message));
        this.streamName = streamName;
    }

    public StreamPublishException(String streamName, String message, Throwable cause) {
        super(String.format("Failed to publish to stream '%s': %s", streamName, message), cause);
        this.streamName = streamName;
    }

    public String getStreamName() {
        return streamName;
    }
}

