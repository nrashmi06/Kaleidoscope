package com.kaleidoscope.backend.async.config;

import com.kaleidoscope.backend.async.consumer.*;
import com.kaleidoscope.backend.async.streaming.ConsumerStreamConstants;
import com.kaleidoscope.backend.async.streaming.ProducerStreamConstants;
import com.kaleidoscope.backend.async.streaming.StreamingConfigConstants;
import com.kaleidoscope.backend.notifications.consumer.NotificationConsumer;
import com.kaleidoscope.backend.posts.consumer.PostInteractionSyncConsumer;
import com.kaleidoscope.backend.posts.consumer.UserProfilePostSyncConsumer;
import com.kaleidoscope.backend.users.consumer.UserProfileFaceEmbeddingConsumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.data.redis.stream.StreamMessageListenerContainer.StreamMessageListenerContainerOptions;
import org.springframework.util.ErrorHandler;

import java.time.Duration;
import java.util.UUID;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class RedisStreamConfig {

    private final RedisConnectionFactory redisConnectionFactory;
    private final MediaAiInsightsConsumer mediaAiInsightsConsumer;
    private final FaceDetectionConsumer faceDetectionConsumer;
    private final FaceRecognitionConsumer faceRecognitionConsumer;
    private final PostInteractionSyncConsumer postInteractionSyncConsumer;
    private final UserProfilePostSyncConsumer userProfilePostSyncConsumer;
    private final UserProfileFaceEmbeddingConsumer userProfileFaceEmbeddingConsumer;
    private final NotificationConsumer notificationConsumer;
    private final HashtagUsageSyncConsumer hashtagUsageSyncConsumer;
    private final PostInsightsEnrichedConsumer postInsightsEnrichedConsumer;

    @Value("${spring.application.name:kaleidoscope}")
    private String applicationName;

    // Use a short UUID fragment for better logging readability
    private final String instanceId = UUID.randomUUID().toString().substring(0, 8);

    @Bean
    public RedisTemplate<String, String> redisTemplate() {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        return template;
    }

    @Bean
    public String uniqueConsumerName() {
        return applicationName + "-" + instanceId;
    }

    @Bean(destroyMethod = "stop")
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamMessageListenerContainer(
            RedisTemplate<String, String> redisTemplate) {
        log.info("Configuring Redis Stream Message Listener Container for App: {} (ID: {})", applicationName, instanceId);

        log.info("Ensuring consumer groups exist for all streams...");
        // 2. Ensure Consumer Groups Exist before connecting
        ensureConsumerGroupExists(redisTemplate, ConsumerStreamConstants.ML_INSIGHTS_STREAM, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, ConsumerStreamConstants.FACE_DETECTION_STREAM, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, ConsumerStreamConstants.FACE_RECOGNITION_STREAM, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, ConsumerStreamConstants.USER_PROFILE_FACE_EMBEDDING_STREAM, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, ProducerStreamConstants.POST_INTERACTION_SYNC_STREAM, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, ProducerStreamConstants.USER_PROFILE_POST_SYNC_STREAM, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, ProducerStreamConstants.NOTIFICATION_EVENTS_STREAM, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, ProducerStreamConstants.HASHTAG_USAGE_SYNC_STREAM, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, ConsumerStreamConstants.POST_INSIGHTS_ENRICHED_STREAM, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
        log.info("✅ Consumer group initialization complete");

        // 3. Configure Container Options for Manual Acknowledgment
        StreamMessageListenerContainerOptions<String, MapRecord<String, String, String>> options =
                StreamMessageListenerContainerOptions.builder()
                        .batchSize(10)
                        .pollTimeout(Duration.ofSeconds(1))
                        .errorHandler(createErrorHandler())
                        .build();

        StreamMessageListenerContainer<String, MapRecord<String, String, String>> container =
                StreamMessageListenerContainer.create(redisConnectionFactory, options);

        // 4. Register Consumers with Unique Names and Manual Acknowledgment
        String consumerName = uniqueConsumerName();

        registerConsumer(container, consumerName, ConsumerStreamConstants.ML_INSIGHTS_STREAM, mediaAiInsightsConsumer);
        registerConsumer(container, consumerName, ConsumerStreamConstants.FACE_DETECTION_STREAM, faceDetectionConsumer);
        registerConsumer(container, consumerName, ConsumerStreamConstants.FACE_RECOGNITION_STREAM, faceRecognitionConsumer);
        registerConsumer(container, consumerName, ConsumerStreamConstants.USER_PROFILE_FACE_EMBEDDING_STREAM, userProfileFaceEmbeddingConsumer);
        registerConsumer(container, consumerName, ProducerStreamConstants.POST_INTERACTION_SYNC_STREAM, postInteractionSyncConsumer);
        registerConsumer(container, consumerName, ProducerStreamConstants.USER_PROFILE_POST_SYNC_STREAM, userProfilePostSyncConsumer);
        registerConsumer(container, consumerName, ProducerStreamConstants.NOTIFICATION_EVENTS_STREAM, notificationConsumer);
        registerConsumer(container, consumerName, ProducerStreamConstants.HASHTAG_USAGE_SYNC_STREAM, hashtagUsageSyncConsumer);
        registerConsumer(container, consumerName, ConsumerStreamConstants.POST_INSIGHTS_ENRICHED_STREAM, postInsightsEnrichedConsumer);

        log.info("✅ Redis Stream Message Listener Container configured successfully with unique consumer name: {}", consumerName);
        log.info("⚠️ Container will be started manually by ElasticsearchStartupSyncService after data sync");
        return container;
    }

    // Helper method to register consumers cleanly
    private void registerConsumer(
            StreamMessageListenerContainer<String, MapRecord<String, String, String>> container,
            String consumerName,
            String streamName,
            StreamListener<String, MapRecord<String, String, String>> listener) {

        String fullConsumerName = consumerName + "-" + listener.getClass().getSimpleName();

        container.receive(
                // Use a dynamic consumer name composed of the application name and a unique ID
                Consumer.from(StreamingConfigConstants.BACKEND_CONSUMER_GROUP, fullConsumerName),
                // Use ">" to read new messages that were never delivered to any consumer in this group
                // This ensures we process both unacknowledged messages (in PEL) and brand new messages
                StreamOffset.create(streamName, ReadOffset.from(">")),
                listener
        );
        log.info("✅ Registered Consumer '{}' for stream '{}' with consumer group '{}' (offset: >)",
                fullConsumerName, streamName, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
    }

    // Existing ensureConsumerGroupExists method (now private and cleaner)
    private void ensureConsumerGroupExists(RedisTemplate<String, String> redisTemplate, String streamName, String groupName) {
        try {
            // Step 1: Check if stream exists, create it if it doesn't
            Long streamLength = null;
            try {
                streamLength = redisTemplate.opsForStream().size(streamName);
            } catch (Exception e) {
                // Stream doesn't exist - this is expected, we'll create it
                log.debug("Stream '{}' doesn't exist yet, will create it...", streamName);
                streamLength = null;
            }

            // Step 2: If stream doesn't exist or is empty, create it with an initial message
            if (streamLength == null || streamLength == 0) {
                log.debug("Creating stream '{}' with initial message...", streamName);
                try {
                    MapRecord<String, String, String> initRecord = MapRecord.create(streamName, java.util.Map.of("init", "true"));
                    redisTemplate.opsForStream().add(initRecord);
                    log.debug("Stream '{}' created successfully", streamName);
                } catch (Exception e) {
                    String msg = e.getMessage() != null ? e.getMessage() : "";
                    // If stream already exists (race condition), that's fine
                    if (!msg.contains("already exists") && !msg.contains("BUSYGROUP")) {
                        log.warn("Failed to create stream '{}': {}", streamName, msg);
                    } else {
                        log.debug("Stream '{}' already exists (race condition)", streamName);
                    }
                }
            }

            // Step 3: Create the consumer group
            try {
                redisTemplate.opsForStream().createGroup(streamName, ReadOffset.from("0-0"), groupName);
                log.info("✅ Created consumer group '{}' for stream '{}'", groupName, streamName);
            } catch (Exception e) {
                String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();

                // If group already exists, that's fine - this is the expected case on restart
                if (errorMsg.contains("BUSYGROUP") || errorMsg.contains("already exists")) {
                    log.debug("Consumer group '{}' already exists for stream '{}'", groupName, streamName);
                } else {
                    // For other errors, try using native connection as fallback
                    log.debug("Standard createGroup failed for '{}', trying native connection...", streamName);
                    try {
                        Boolean result = redisTemplate.execute((RedisCallback<Boolean>) connection -> {
                            try {
                                connection.streamCommands().xGroupCreate(
                                        streamName.getBytes(),
                                        groupName,
                                        ReadOffset.from("0-0"),
                                        true // mkstream: create stream if it doesn't exist
                                );
                                return true;
                            } catch (Exception ex) {
                                String msg = ex.getMessage() != null ? ex.getMessage() : "";
                                if (msg.contains("BUSYGROUP") || msg.contains("already exists")) {
                                    return true; // Group already exists, that's fine
                                }
                                throw ex;
                            }
                        });

                        if (Boolean.TRUE.equals(result)) {
                            log.info("✅ Created consumer group '{}' for stream '{}' using native connection", groupName, streamName);
                        }
                    } catch (Exception ex2) {
                        String msg2 = ex2.getMessage() != null ? ex2.getMessage() : "";
                        if (msg2.contains("BUSYGROUP") || msg2.contains("already exists")) {
                            log.debug("Consumer group '{}' already exists for stream '{}'", groupName, streamName);
                        } else {
                            log.warn("Could not create consumer group '{}' for stream '{}': {}", groupName, streamName, msg2);
                        }
                    }
                }
            }
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();

            // Check if it's a BUSYGROUP error (group already exists) - this is fine
            if (errorMsg.contains("BUSYGROUP") || errorMsg.contains("already exists")) {
                log.debug("Consumer group '{}' already exists for stream '{}'", groupName, streamName);
            } else {
                log.warn("Could not create/verify consumer group '{}' for stream '{}': {}", groupName, streamName, errorMsg);
                // Log the full exception for debugging
                log.debug("Full exception details:", e);
            }
        }
    }

    private ErrorHandler createErrorHandler() {
        return throwable -> {
            // Unwrap exception to get root cause
            Throwable rootCause = throwable;
            while (rootCause.getCause() != null) {
                rootCause = rootCause.getCause();
            }

            String msg = rootCause.getMessage() != null ? rootCause.getMessage() : "";

            // Check if this is a NOGROUP error - stream exists but consumer group doesn't
            if (msg.contains("NOGROUP")) {
                // Extract stream name from error message
                String streamName = extractStreamName(msg);
                log.warn("Consumer group missing for stream '{}'. Creating now...", streamName);

                // Actually create the consumer group
                try {
                    RedisTemplate<String, String> redis = redisTemplate();
                    log.info("Stream '{}' found, creating consumer group...", streamName);

                    // Ensure stream exists first
                    Long streamLength = redis.opsForStream().size(streamName);
                    if (streamLength == null || streamLength == 0) {
                        redis.opsForStream().add(streamName, java.util.Map.of("init", "true"));
                    }

                    // Create group with correct parameter order: key, readOffset, group
                    redis.opsForStream().createGroup(
                            streamName,
                            ReadOffset.from("0-0"),
                            StreamingConfigConstants.BACKEND_CONSUMER_GROUP
                    );
                    log.info("✅ Successfully created consumer group 'backend-group' for stream '{}'", streamName);
                } catch (Exception e) {
                    if (e.getMessage() != null && e.getMessage().contains("BUSYGROUP")) {
                        log.debug("Group already exists for '{}'", streamName);
                    } else {
                        log.error("Failed to create group for '{}': {}", streamName, e.getMessage());
                    }
                }
                return; // Don't log as ERROR for NOGROUP, we're handling it
            }

            // For other errors, log them as actual errors
            log.error("Unrecoverable error processing Redis Stream message. Message left in PEL: {}",
                    msg, throwable);
        };
    }

    // Helper method to extract stream name from NOGROUP error message
    private String extractStreamName(String errorMsg) {
        // Parse: "NOGROUP No such key 'stream-name' or consumer group..."
        if (errorMsg.contains("No such key '")) {
            int start = errorMsg.indexOf("No such key '") + 13;
            int end = errorMsg.indexOf("'", start);
            if (end > start) {
                return errorMsg.substring(start, end);
            }
        }
        return "unknown";
    }
}

