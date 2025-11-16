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
    public static final String BLOG_INTERACTION_SYNC_STREAM = "blog-interaction-sync";
    public static final String USER_PROFILE_POST_SYNC_STREAM = "user-profile-post-sync";
    public static final String HASHTAG_USAGE_SYNC_STREAM = "hashtag-usage-sync-stream";

    // Notification streams
    public static final String NOTIFICATION_EVENTS_STREAM = "notification-events";

    /**
     * Published by Backend -> Consumed by AI Post Aggregator.
     * Tells the aggregator that all media for a post have been processed.
     */
    public static final String POST_AGGREGATION_TRIGGER_STREAM = "post-aggregation-trigger";

    /**
     * Published by Backend -> Consumed by AI ES Sync Service.
     * Tells the sync service that a read model table has been updated.
     */
    public static final String ES_SYNC_QUEUE_STREAM = "es-sync-queue";

    private ProducerStreamConstants() {
        // Utility class - prevent instantiation
    }
}
