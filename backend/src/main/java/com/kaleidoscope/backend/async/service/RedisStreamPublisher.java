package com.kaleidoscope.backend.async.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.kaleidoscope.backend.async.exception.async.StreamPublishException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisStreamPublisher {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    // Inject application name for logging clarity
    @Value("${spring.application.name:kaleidoscope-backend}")
    private String applicationName;

    // Add configuration for critical vs non-critical events
    private static final Set<String> CRITICAL_STREAMS = Set.of(
        "media-ai-insights", "face-detection", "face-recognition"
    );

    public void publish(String streamName, Object eventDto) {
        try {
            log.info("[{}] Publishing event to Redis Stream '{}': eventType={}",
                    applicationName, streamName, eventDto.getClass().getSimpleName());

            // Convert the DTO to a Map with proper String conversion
            // Use TypeReference for robust conversion of generic types
            Map<String, Object> rawMap = objectMapper.convertValue(eventDto, new TypeReference<Map<String, Object>>() {});

            // CRITICAL FIX: Convert complex objects (like Map/List) to JSON string
            Map<String, String> messagePayload = new HashMap<>();
            for (Map.Entry<String, Object> entry : rawMap.entrySet()) {
                Object value = entry.getValue();
                if (value == null) {
                    messagePayload.put(entry.getKey(), null);
                } else if (value instanceof Map || value instanceof List) {
                    // Use ObjectMapper to serialize complex objects into a valid JSON string
                    messagePayload.put(entry.getKey(), objectMapper.writeValueAsString(value));
                } else {
                    // Simple types (Long, String, Enum) can use toString()
                    messagePayload.put(entry.getKey(), value.toString());
                }
            }

            MapRecord<String, String, String> record = MapRecord.create(streamName, messagePayload);
            String messageId = stringRedisTemplate.opsForStream().add(record).getValue();

            log.info("[{}] Successfully published event to Redis Stream '{}': messageId={}, payload={}",
                    applicationName, streamName, messageId, messagePayload);
        } catch (JsonProcessingException e) {
            log.error("[{}] Failed to serialize event to JSON for Redis Stream '{}': eventType={}, error={}",
                     applicationName, streamName, eventDto.getClass().getSimpleName(), e.getMessage(), e);

            if (CRITICAL_STREAMS.contains(streamName)) {
                throw new StreamPublishException(streamName, "Critical event serialization failed", e);
            }
        } catch (Exception e) {
            log.error("[{}] Failed to publish event to Redis Stream '{}': eventType={}, error={}",
                     applicationName, streamName, eventDto.getClass().getSimpleName(), e.getMessage(), e);

            // For critical streams, rethrow to ensure caller handles the failure
            if (CRITICAL_STREAMS.contains(streamName)) {
                throw new StreamPublishException(streamName, "Critical event publish failed", e);
            }
            // Non-critical events can be logged and continue
        }
    }

    // Add method for publishing with retry
    public void publishWithRetry(String streamName, Object eventDto, int maxRetries) {
        int attempts = 0;
        while (attempts < maxRetries) {
            try {
                publish(streamName, eventDto);
                return; // Success
            } catch (Exception e) {
                attempts++;
                if (attempts >= maxRetries) {
                    log.error("Failed to publish after {} attempts to stream '{}': {}",
                             maxRetries, streamName, e.getMessage());
                    throw new StreamPublishException(streamName, "Failed after " + maxRetries + " attempts", e);
                }

                // Exponential backoff
                try {
                    Thread.sleep(1000L * attempts);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new StreamPublishException(streamName, "Interrupted during retry backoff", ie);
                }
            }
        }
    }
}
