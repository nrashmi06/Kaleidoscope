package com.kaleidoscope.backend.ml.config;

/**
 * Constants for Redis Stream names used in ML processing
 */
public final class RedisStreamConstants {
    
    public static final String PROFILE_PICTURE_PROCESSING_STREAM = "profile-picture-processing";
    public static final String POST_IMAGE_PROCESSING_STREAM = "post-image-processing";
    public static final String POST_UPDATE_STREAM = "post-update-processing";
    public static final String POST_INTERACTION_SYNC_STREAM = "post-interaction-sync";
    public static final String USER_PROFILE_POST_SYNC_STREAM = "user-profile-post-sync";

    private RedisStreamConstants() {
        // Utility class - prevent instantiation
    }
}
