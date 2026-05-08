package com.kaleidoscope.backend.async.config;

import com.kaleidoscope.backend.async.streaming.ConsumerStreamConstants;
import com.kaleidoscope.backend.async.streaming.StreamingConfigConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.stream.PendingMessagesSummary;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisStreamConsumerCleanupService {

    private final RedisTemplate<String, String> redisTemplate;

    // Produced by RedisStreamConfig#uniqueConsumerName (example: kaleidoscope-backend-8d78f1a0278a)
    @Qualifier("uniqueConsumerName")
    private final String uniqueConsumerName;

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
                PendingMessagesSummary summary = redisTemplate.opsForStream().pending(stream, group);
                long pending = summary != null ? summary.getTotalPendingMessages() : 0L;
                if (pending > 0) {
                    // Keep conservative behavior: avoid deleting consumers while stream has pending entries.
                    continue;
                }

                redisTemplate.execute((RedisConnection connection) -> {
                    byte[] rawStream = stream.getBytes(StandardCharsets.UTF_8);

                    try {
                        var consumers = redisTemplate.opsForStream().consumers(stream, group);
                        if (consumers != null) {
                            for (var consumer : consumers) {
                                String name = consumer.consumerName();

                                // Only touch backend consumers.
                                if (!name.startsWith("kaleidoscope-backend-")) {
                                    continue;
                                }

                                // Keep current active instance consumers.
                                if (name.startsWith(uniqueConsumerName + "-")) {
                                    continue;
                                }

                                // Delete stale backend consumer from old instance IDs.
                                // Using String overload for group and consumer name as per Spring Data Redis API
                                connection.streamCommands().xGroupDelConsumer(rawStream, group, name);
                                log.info("Deleted stale backend consumer stream={} group={} consumer={}",
                                        stream, group, name);
                            }
                        }
                    } catch (Exception ex) {
                        log.warn("Consumer cleanup failed stream={} group={}", stream, group, ex);
                    }

                    return null;
                });
            } catch (Exception ex) {
                log.warn("Consumer cleanup skipped stream={} group={}", stream, group, ex);
            }
        }
    }
}