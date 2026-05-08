package com.kaleidoscope.backend.async.config;

import com.kaleidoscope.backend.async.streaming.ConsumerStreamConstants;
import com.kaleidoscope.backend.async.streaming.StreamingConfigConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.PendingMessagesSummary;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StreamOperations;
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

        StreamOperations<String, Object, Object> streamOps = redisTemplate.opsForStream();

        for (String stream : streams) {
            try {
                // consumers() returns StreamInfo.XInfoConsumers, not List<Consumer>
                // Iterate it directly — each entry is a StreamInfo.XInfoConsumer
                var xInfoConsumers = streamOps.consumers(stream, group);
                if (xInfoConsumers == null) continue;

                PendingMessagesSummary summary = streamOps.pending(stream, group);
                boolean groupHasNoPending = summary != null && summary.getTotalPendingMessages() == 0;

                for (var xInfoConsumer : xInfoConsumers) {
                    String consumerName = xInfoConsumer.consumerName();
                    long idleMs = xInfoConsumer.idleTimeMs();

                    boolean isStale = idleMs >= MIN_IDLE_FOR_CLEANUP.toMillis();

                    log.debug(
                            "Consumer check stream={} group={} consumer={} idleMs={} stale={} groupHasNoPending={}",
                            stream, group, consumerName, idleMs, isStale, groupHasNoPending
                    );

                    if (isStale && groupHasNoPending) {
                        try {
                            streamOps.deleteConsumer(stream, Consumer.from(group, consumerName));
                            log.info("Deleted stale consumer stream={} group={} consumer={} idleMs={}",
                                    stream, group, consumerName, idleMs);
                        } catch (Exception deleteEx) {
                            log.warn("Failed to delete stale consumer stream={} group={} consumer={}",
                                    stream, group, consumerName, deleteEx);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Consumer cleanup check failed stream={}", stream, e);
            }
        }
    }
}