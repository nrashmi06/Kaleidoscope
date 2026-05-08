package com.kaleidoscope.backend.async.config;

import com.kaleidoscope.backend.async.streaming.ConsumerStreamConstants;
import com.kaleidoscope.backend.async.streaming.StreamingConfigConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.PendingMessagesSummary;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisStreamConsumerCleanupService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final Duration MIN_IDLE_FOR_CLEANUP = Duration.ofHours(6);

    @Scheduled(fixedDelayString = "${async.stream.consumer-cleanup-ms:900000}")
    public void cleanupStaleConsumers() {
        String group = StreamingConfigConstants.BACKEND_CONSUMER_GROUP;
        List<String> streams = List.of(
                ConsumerStreamConstants.ML_INSIGHTS_STREAM,
                ConsumerStreamConstants.FACE_DETECTION_STREAM,
                ConsumerStreamConstants.FACE_RECOGNITION_STREAM,
                ConsumerStreamConstants.POST_INSIGHTS_ENRICHED_STREAM
        );

        for (String stream : streams) {
            try {
                List<org.springframework.data.redis.connection.stream.Consumer> consumers =
                        redisTemplate.opsForStream().consumers(stream, group);
                if (consumers == null) continue;

                for (Consumer consumer : consumers) {
                    // Spring abstraction does not expose full idle+pending detail per consumer directly.
                    // Use conservative cleanup only if PEL is zero for this stream/group and consumer is not current active hostname.
                    PendingMessagesSummary summary = redisTemplate.opsForStream().pending(stream, group);
                    if (summary != null && summary.getTotalPendingMessages() == 0) {
                        // optional: delete old consumer names matching prior host suffix patterns
                        // redisTemplate.opsForStream().deleteConsumer(stream, Consumer.from(group, consumer.getName()));
                    }
                }
            } catch (Exception e) {
                log.warn("Consumer cleanup check failed stream={}", stream, e);
            }
        }
    }
}
