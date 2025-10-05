package com.kaleidoscope.backend.async.exception.async;

public class BboxParsingException extends RuntimeException {
    private final String bboxValue;

    public BboxParsingException(String bboxValue) {
        super(String.format("Failed to parse bbox coordinates: %s", bboxValue));
        this.bboxValue = bboxValue;
    }

    public BboxParsingException(String bboxValue, Throwable cause) {
        super(String.format("Failed to parse bbox coordinates: %s", bboxValue), cause);
        this.bboxValue = bboxValue;
    }

    public String getBboxValue() {
        return bboxValue;
    }
}

