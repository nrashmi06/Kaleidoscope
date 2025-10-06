package com.kaleidoscope.backend.async.exception.async;

public class StreamDeserializationException extends RuntimeException {
    private final String streamName;
    private final String messageId;

    public StreamDeserializationException(String streamName, String messageId, String message) {
        super(String.format("Failed to deserialize message from stream '%s' (messageId: %s): %s", 
                streamName, messageId, message));
        this.streamName = streamName;
        this.messageId = messageId;
    }

    public StreamDeserializationException(String streamName, String messageId, String message, Throwable cause) {
        super(String.format("Failed to deserialize message from stream '%s' (messageId: %s): %s", 
                streamName, messageId, message), cause);
        this.streamName = streamName;
        this.messageId = messageId;
    }

    public String getStreamName() {
        return streamName;
    }

    public String getMessageId() {
        return messageId;
    }
}

