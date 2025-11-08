package com.kaleidoscope.backend.async.config;

import com.kaleidoscope.backend.async.consumer.FaceDetectionConsumer;
import com.kaleidoscope.backend.async.consumer.FaceRecognitionConsumer;
import com.kaleidoscope.backend.async.consumer.HashtagUsageSyncConsumer;
import com.kaleidoscope.backend.async.consumer.MediaAiInsightsConsumer;
import com.kaleidoscope.backend.async.consumer.PostInsightsEnrichedConsumer;
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

    @Bean(initMethod = "start", destroyMethod = "stop")
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamMessageListenerContainer(
            RedisTemplate<String, String> redisTemplate) {
        log.info("Configuring Redis Stream Message Listener Container for App: {} (ID: {})", applicationName, instanceId);

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

        log.info("Redis Stream Message Listener Container configured successfully with unique consumer name: {}", consumerName);
        return container;
    }

    // Helper method to register consumers cleanly
    private void registerConsumer(
            StreamMessageListenerContainer<String, MapRecord<String, String, String>> container,
            String consumerName,
            String streamName,
            StreamListener<String, MapRecord<String, String, String>> listener) {

        container.receive(
                // Use a dynamic consumer name composed of the application name and a unique ID
                Consumer.from(StreamingConfigConstants.BACKEND_CONSUMER_GROUP, consumerName + "-" + listener.getClass().getSimpleName()),
                // Start from the last successfully consumed message for the group
                StreamOffset.create(streamName, ReadOffset.lastConsumed()),
                listener
        );
        log.info("Registered Consumer {} for stream: {} with group: {}",
                consumerName + "-" + listener.getClass().getSimpleName(), streamName, StreamingConfigConstants.BACKEND_CONSUMER_GROUP);
    }

    // Existing ensureConsumerGroupExists method (now private and cleaner)
    private void ensureConsumerGroupExists(RedisTemplate<String, String> redisTemplate, String streamName, String groupName) {
        try {
            // Try to create consumer group (this will fail if it already exists, which is fine)
            // Use ReadOffset.from("0-0") to ensure creation even if the stream is currently empty
            redisTemplate.opsForStream().createGroup(streamName, ReadOffset.from("0-0"), groupName);
            log.info("Created consumer group '{}' for stream '{}'", groupName, streamName);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("BUSYGROUP")) {
                log.debug("Consumer group '{}' already exists for stream '{}'", groupName, streamName);
            } else if (e.getMessage() != null && e.getMessage().contains("NOKEY")) {
                log.warn("Stream '{}' does not exist yet. Group creation failed (NOKEY), but will be created automatically on first publish/receive.", streamName);
            } else {
                log.warn("Could not create/verify consumer group '{}' for stream '{}': {}", groupName, streamName, e.getMessage());
            }
        }
    }

    private ErrorHandler createErrorHandler() {
        return throwable -> {
            // Log the failure. If the root consumer threw a business logic exception
            // (PostMediaNotFoundException, StreamDeserializationException, etc.)
            // it means the consumer failed and re-threw the exception.
            // The container will NOT XACK, leaving the message in the PEL.

            log.error("Unrecoverable error processing Redis Stream message. Message left in PEL: {}",
                    throwable.getMessage(), throwable);
        };
    }
}
