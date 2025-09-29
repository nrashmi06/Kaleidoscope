package com.kaleidoscope.backend.ml.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisStreamPublisher {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    // Add configuration for critical vs non-critical events
    private static final Set<String> CRITICAL_STREAMS = Set.of(
        "media-ai-insights", "face-detection", "face-recognition"
    );

    public void publish(String streamName, Object eventDto) {
        try {
            log.info("Publishing event to Redis Stream '{}': eventType={}", streamName, eventDto.getClass().getSimpleName());

            // Convert the DTO to a Map
            @SuppressWarnings("unchecked")
            Map<String, String> messagePayload = objectMapper.convertValue(eventDto, Map.class);

            MapRecord<String, String, String> record = MapRecord.create(streamName, messagePayload);
            String messageId = stringRedisTemplate.opsForStream().add(record).getValue();

            log.info("Successfully published event to Redis Stream '{}': messageId={}, payload={}",
                    streamName, messageId, messagePayload);
        } catch (Exception e) {
            log.error("Failed to publish event to Redis Stream '{}': eventType={}, error={}",
                     streamName, eventDto.getClass().getSimpleName(), e.getMessage(), e);

            // For critical streams, rethrow to ensure caller handles the failure
            if (CRITICAL_STREAMS.contains(streamName)) {
                throw new RuntimeException("Failed to publish critical event to stream: " + streamName, e);
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
                    throw e;
                }

                // Exponential backoff
                try {
                    Thread.sleep(1000L * attempts);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted during retry backoff", ie);
                }
            }
        }
    }
}
