package com.kaleidoscope.backend.async.exception.async;

public class StreamMessageProcessingException extends RuntimeException {
    private final String streamName;
    private final String messageId;

    public StreamMessageProcessingException(String streamName, String messageId, String message) {
        super(String.format("Failed to process message from stream '%s' (messageId: %s): %s", 
                streamName, messageId, message));
        this.streamName = streamName;
        this.messageId = messageId;
    }

    public StreamMessageProcessingException(String streamName, String messageId, String message, Throwable cause) {
        super(String.format("Failed to process message from stream '%s' (messageId: %s): %s", 
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

