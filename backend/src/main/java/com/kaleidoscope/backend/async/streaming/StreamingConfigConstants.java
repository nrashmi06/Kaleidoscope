package com.kaleidoscope.backend.async.streaming;

/**
 * Configuration constants for Redis Stream consumers
 * Contains consumer groups, consumer names, and other consumer-related settings
 */
public final class StreamingConfigConstants {
    
    // Consumer group names
    public static final String BACKEND_CONSUMER_GROUP = "backend-group";
    
    // Individual consumer names within the group
    public static final String MEDIA_AI_CONSUMER = "media-ai-consumer";
    public static final String FACE_DETECTION_CONSUMER = "face-detection-consumer";
    public static final String FACE_RECOGNITION_CONSUMER = "face-recognition-consumer";
    public static final String POST_INTERACTION_SYNC_CONSUMER = "post-interaction-sync-consumer";
    public static final String USER_PROFILE_POST_SYNC_CONSUMER = "user-profile-post-sync-consumer";

    private StreamingConfigConstants() {
        // Utility class - prevent instantiation
    }
}
