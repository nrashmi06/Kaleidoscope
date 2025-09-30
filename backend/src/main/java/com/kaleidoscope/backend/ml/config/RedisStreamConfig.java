package com.kaleidoscope.backend.ml.config;

import com.kaleidoscope.backend.ml.consumer.FaceDetectionConsumer;
import com.kaleidoscope.backend.ml.consumer.FaceRecognitionConsumer;
import com.kaleidoscope.backend.ml.consumer.MediaAiInsightsConsumer;
import com.kaleidoscope.backend.posts.consumer.PostInteractionSyncConsumer;
import com.kaleidoscope.backend.posts.consumer.UserProfilePostSyncConsumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.util.ErrorHandler;

import java.time.Duration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class RedisStreamConfig {

    // Stream names - these should match the streams your ML service publishes to
    private static final String ML_INSIGHTS_STREAM = "ml-insights-results";
    private static final String FACE_DETECTION_STREAM = "face-detection-results";
    private static final String FACE_RECOGNITION_STREAM = "face-recognition-results";
    
    // Consumer group name
    private static final String CONSUMER_GROUP = "backend-group";

    private final RedisConnectionFactory redisConnectionFactory;
    private final MediaAiInsightsConsumer mediaAiInsightsConsumer;
    private final FaceDetectionConsumer faceDetectionConsumer;
    private final FaceRecognitionConsumer faceRecognitionConsumer;
    private final PostInteractionSyncConsumer postInteractionSyncConsumer;
    private final UserProfilePostSyncConsumer userProfilePostSyncConsumer;

    @Bean
    public RedisTemplate<String, String> redisTemplate() {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        return template;
    }

    @Bean(initMethod = "start", destroyMethod = "stop")
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamMessageListenerContainer(
            RedisTemplate<String, String> redisTemplate) {
        log.info("Configuring Redis Stream Message Listener Container");

        // Ensure consumer groups exist before registering listeners
        ensureConsumerGroupExists(redisTemplate, ML_INSIGHTS_STREAM, CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, FACE_DETECTION_STREAM, CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, FACE_RECOGNITION_STREAM, CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, RedisStreamConstants.POST_INTERACTION_SYNC_STREAM, CONSUMER_GROUP);
        ensureConsumerGroupExists(redisTemplate, RedisStreamConstants.USER_PROFILE_POST_SYNC_STREAM, CONSUMER_GROUP);

        // Create container options with explicit MapRecord type matching our consumers
        StreamMessageListenerContainer.StreamMessageListenerContainerOptions<String, MapRecord<String, String, String>> options =
                StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                        .batchSize(10)
                        .pollTimeout(Duration.ofSeconds(1))
                        .errorHandler(createErrorHandler())
                        .build();

        // Create the container with the properly typed options
        StreamMessageListenerContainer<String, MapRecord<String, String, String>> container =
                StreamMessageListenerContainer.create(redisConnectionFactory, options);

        // Register consumers with proper consumer groups - using ReadOffset.latest() for new groups
        container.receive(
                Consumer.from(CONSUMER_GROUP, "media-ai-consumer"),
                StreamOffset.create(ML_INSIGHTS_STREAM, ReadOffset.latest()),
                mediaAiInsightsConsumer
        );
        log.info("Registered MediaAiInsightsConsumer for stream: {} with consumer group: {}", 
                ML_INSIGHTS_STREAM, CONSUMER_GROUP);

        container.receive(
                Consumer.from(CONSUMER_GROUP, "face-detection-consumer"),
                StreamOffset.create(FACE_DETECTION_STREAM, ReadOffset.latest()),
                faceDetectionConsumer
        );
        log.info("Registered FaceDetectionConsumer for stream: {} with consumer group: {}", 
                FACE_DETECTION_STREAM, CONSUMER_GROUP);

        container.receive(
                Consumer.from(CONSUMER_GROUP, "face-recognition-consumer"),
                StreamOffset.create(FACE_RECOGNITION_STREAM, ReadOffset.latest()),
                faceRecognitionConsumer
        );
        log.info("Registered FaceRecognitionConsumer for stream: {} with consumer group: {}", 
                FACE_RECOGNITION_STREAM, CONSUMER_GROUP);

        container.receive(
                Consumer.from(CONSUMER_GROUP, "post-interaction-sync-consumer"),
                StreamOffset.create(RedisStreamConstants.POST_INTERACTION_SYNC_STREAM, ReadOffset.latest()),
                postInteractionSyncConsumer
        );
        log.info("Registered PostInteractionSyncConsumer for stream: {} with consumer group: {}",
                RedisStreamConstants.POST_INTERACTION_SYNC_STREAM, CONSUMER_GROUP);

        container.receive(
                Consumer.from(CONSUMER_GROUP, "user-profile-post-sync-consumer"),
                StreamOffset.create(RedisStreamConstants.USER_PROFILE_POST_SYNC_STREAM, ReadOffset.latest()),
                userProfilePostSyncConsumer
        );
        log.info("Registered UserProfilePostSyncConsumer for stream: {} with consumer group: {}",
                RedisStreamConstants.USER_PROFILE_POST_SYNC_STREAM, CONSUMER_GROUP);

        log.info("Redis Stream Message Listener Container configured successfully with {} consumers", 5);
        return container;
    }

    private void ensureConsumerGroupExists(RedisTemplate<String, String> redisTemplate, String streamName, String groupName) {
        try {
            // Check if stream exists first
            Boolean exists = redisTemplate.hasKey(streamName);
            if (!exists) {
                log.info("Stream '{}' does not exist yet. Consumer group will be created when stream is first used.", streamName);
                return;
            }

            // Try to create consumer group (this will fail if it already exists, which is fine)
            redisTemplate.opsForStream().createGroup(streamName, groupName);
            log.info("Created consumer group '{}' for stream '{}'", groupName, streamName);

        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("BUSYGROUP")) {
                log.debug("Consumer group '{}' already exists for stream '{}' - this is expected", groupName, streamName);
            } else if (e.getMessage() != null && e.getMessage().contains("NOKEY")) {
                log.info("Stream '{}' does not exist yet. Consumer group will be created when stream receives first message.", streamName);
            } else {
                log.warn("Could not create/verify consumer group '{}' for stream '{}': {}", groupName, streamName, e.getMessage());
            }
        }
    }

    private ErrorHandler createErrorHandler() {
        return throwable -> {
            // Check if this is a NOGROUP error (can be nested in the cause chain)
            boolean isNoGroupError = isNoGroupError(throwable);

            if (isNoGroupError) {
                log.warn("Redis Stream or Consumer Group does not exist yet. This is normal during startup before ML service publishes messages. " +
                        "The consumers will automatically start processing when streams become available.");
            } else {
                log.error("Error occurred while processing Redis Stream message: {}", throwable.getMessage(), throwable);

                if (throwable.getCause() != null) {
                    log.error("Root cause: {}", throwable.getCause().getMessage());
                }
            }
        };
    }

    private boolean isNoGroupError(Throwable throwable) {
        // Check the entire cause chain for NOGROUP errors
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null && message.contains("NOGROUP")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
