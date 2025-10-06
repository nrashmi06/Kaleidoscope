package com.kaleidoscope.backend.async.exception;

import com.kaleidoscope.backend.async.exception.async.*;
import com.kaleidoscope.backend.shared.exception.other.UserNotFoundException;
import com.kaleidoscope.backend.shared.response.AppResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice(basePackages = "com.kaleidoscope.backend.async")
@Slf4j
public class AsyncExceptionHandler {

    @ExceptionHandler(StreamPublishException.class)
    public ResponseEntity<AppResponse<Object>> handleStreamPublish(StreamPublishException ex, WebRequest request) {
        String path = getRequestPath(request);
        log.error("Stream publish error on stream '{}': {}", ex.getStreamName(), ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Stream publishing failed",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(StreamDeserializationException.class)
    public ResponseEntity<AppResponse<Object>> handleStreamDeserialization(StreamDeserializationException ex, WebRequest request) {
        String path = getRequestPath(request);
        log.error("Stream deserialization error on stream '{}' (messageId: {}): {}",
                ex.getStreamName(), ex.getMessageId(), ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Message deserialization failed",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MediaAiInsightsNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleMediaAiInsightsNotFound(MediaAiInsightsNotFoundException ex, WebRequest request) {
        String path = getRequestPath(request);
        log.error("MediaAiInsights not found for mediaId: {}", ex.getMediaId());
        AppResponse<Object> response = AppResponse.error(
                "MediaAiInsights not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MediaDetectedFaceNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleMediaDetectedFaceNotFound(MediaDetectedFaceNotFoundException ex, WebRequest request) {
        String path = getRequestPath(request);
        log.error("MediaDetectedFace not found for faceId: {}", ex.getFaceId());
        AppResponse<Object> response = AppResponse.error(
                "MediaDetectedFace not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(PostMediaNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handlePostMediaNotFound(PostMediaNotFoundException ex, WebRequest request) {
        String path = getRequestPath(request);
        log.error("PostMedia not found for mediaId: {}", ex.getMediaId());
        AppResponse<Object> response = AppResponse.error(
                "PostMedia not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<AppResponse<Object>> handleUserNotFound(UserNotFoundException ex, WebRequest request) {
        String path = getRequestPath(request);
        log.error("User not found in async processing: {}", ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "User not found",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(StreamMessageProcessingException.class)
    public ResponseEntity<AppResponse<Object>> handleStreamMessageProcessing(StreamMessageProcessingException ex, WebRequest request) {
        String path = getRequestPath(request);
        log.error("Stream message processing error on stream '{}' (messageId: {}): {}",
                ex.getStreamName(), ex.getMessageId(), ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Message processing failed",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(BboxParsingException.class)
    public ResponseEntity<AppResponse<Object>> handleBboxParsing(BboxParsingException ex, WebRequest request) {
        String path = getRequestPath(request);
        log.error("Bbox parsing error for value '{}': {}", ex.getBboxValue(), ex.getMessage());
        AppResponse<Object> response = AppResponse.error(
                "Bbox coordinates parsing failed",
                ex.getMessage(),
                path
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    private String getRequestPath(WebRequest request) {
        try {
            return ((ServletWebRequest) request).getRequest().getRequestURI();
        } catch (Exception e) {
            return "/async"; // Default path for async operations
        }
    }
}
