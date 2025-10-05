package com.kaleidoscope.backend.async.streaming;

/**
 * Constants for Redis Stream names used for publishing events from the backend services
 * These streams are written TO by the backend (producer side)
 */
public final class ProducerStreamConstants {
    
    // Image and media processing streams
    public static final String PROFILE_PICTURE_PROCESSING_STREAM = "profile-picture-processing";
    public static final String POST_IMAGE_PROCESSING_STREAM = "post-image-processing";
    
    // Content update streams
    public static final String POST_UPDATE_STREAM = "post-update-processing";
    
    // Synchronization streams
    public static final String POST_INTERACTION_SYNC_STREAM = "post-interaction-sync";
    public static final String USER_PROFILE_POST_SYNC_STREAM = "user-profile-post-sync";

    private ProducerStreamConstants() {
        // Utility class - prevent instantiation
    }
}
