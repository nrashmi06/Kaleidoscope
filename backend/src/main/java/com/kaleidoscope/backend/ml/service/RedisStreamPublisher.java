package com.kaleidoscope.backend.ml.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisStreamPublisher {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

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
            // Note: We don't rethrow the exception to avoid breaking the main business flow
            // ML processing is typically non-critical for the core application functionality
        }
    }
}
