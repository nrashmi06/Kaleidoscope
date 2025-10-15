package com.kaleidoscope.backend.async.streaming;

/**
 * Constants for Redis Stream names used for consuming events from external services (e.g., ML services)
 * These streams are read FROM by the backend (consumer side)
 */
public final class ConsumerStreamConstants {
    
    // ML service result streams
    public static final String ML_INSIGHTS_STREAM = "ml-insights-results";
    public static final String FACE_DETECTION_STREAM = "face-detection-results";
    public static final String FACE_RECOGNITION_STREAM = "face-recognition-results";
    public static final String USER_PROFILE_FACE_EMBEDDING_STREAM = "user-profile-face-embedding-results";

    private ConsumerStreamConstants() {
        // Utility class - prevent instantiation
    }
}
