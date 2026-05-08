package com.kaleidoscope.backend.async.config;

import com.kaleidoscope.backend.async.consumer.*;
import com.kaleidoscope.backend.async.streaming.ConsumerStreamConstants;
import com.kaleidoscope.backend.async.streaming.StreamingConfigConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisStreamPelRecoveryService {

    private final RedisTemplate<String, String> redisTemplate;

    // Reuse existing consumers so business logic remains centralized
    private final MediaAiInsightsConsumer mediaAiInsightsConsumer;
    private final FaceDetectionConsumer faceDetectionConsumer;
    private final FaceRecognitionConsumer faceRecognitionConsumer;
    private final PostInsightsEnrichedConsumer postInsightsEnrichedConsumer;

    @Value("${spring.application.name:kaleidoscope-backend}")
    private String appName;

    // Claim entries idle for at least 60s
    private static final Duration MIN_IDLE = Duration.ofSeconds(60);
    private static final int CLAIM_BATCH_SIZE = 50;

    @PostConstruct
    public void recoverPendingAtStartup() {
        log.info("Starting Redis PEL recovery at startup");
        recoverStream(ConsumerStreamConstants.ML_INSIGHTS_STREAM, mediaAiInsightsConsumer);
        recoverStream(ConsumerStreamConstants.FACE_DETECTION_STREAM, faceDetectionConsumer);
        recoverStream(ConsumerStreamConstants.FACE_RECOGNITION_STREAM, faceRecognitionConsumer);
        recoverStream(ConsumerStreamConstants.POST_INSIGHTS_ENRICHED_STREAM, postInsightsEnrichedConsumer);
        log.info("Completed Redis PEL recovery at startup");
    }

    private void recoverStream(
            String stream,
            org.springframework.data.redis.stream.StreamListener<String, MapRecord<String, String, String>> listener
    ) {
        String group = StreamingConfigConstants.BACKEND_CONSUMER_GROUP;
        String recoveryConsumer = appName + "-pel-recovery";
        String nextStartId = "0-0";
        long recovered = 0L;

        while (true) {
            AutoClaimedRecords<String, String> claimed = redisTemplate.opsForStream().autoClaim(
                    stream,
                    Consumer.from(group, recoveryConsumer),
                    MIN_IDLE,
                    ReadOffset.from(nextStartId),
                    CLAIM_BATCH_SIZE
            );

            if (claimed == null || claimed.getRecords().isEmpty()) {
                break;
            }

            List<MapRecord<String, String, String>> records = claimed.getRecords();
            for (MapRecord<String, String, String> record : records) {
                try {
                    listener.onMessage(record); // run existing business logic
                    Long acked = redisTemplate.opsForStream().acknowledge(group, record);
                    log.info("Recovered+acked pending message stream={} id={} acked={}", stream, record.getId().getValue(), acked);
                    recovered++;
                } catch (Exception ex) {
                    // Keep message in PEL for another retry pass
                    log.error("Failed while recovering pending message stream={} id={} (left in PEL)",
                            stream, record.getId().getValue(), ex);
                }
            }

            nextStartId = claimed.getNextIdAsString();
            if (nextStartId == null || "0-0".equals(nextStartId)) {
                break;
            }
        }

        log.info("PEL recovery summary stream={} recovered={}", stream, recovered);
    }

    @Scheduled(fixedDelayString = "${async.stream.pending-metrics-ms:60000}")
    public void logPendingMetrics() {
        List<String> streams = List.of(
                ConsumerStreamConstants.ML_INSIGHTS_STREAM,
                ConsumerStreamConstants.FACE_DETECTION_STREAM,
                ConsumerStreamConstants.FACE_RECOGNITION_STREAM,
                ConsumerStreamConstants.POST_INSIGHTS_ENRICHED_STREAM
        );
        String group = StreamingConfigConstants.BACKEND_CONSUMER_GROUP;

        for (String stream : streams) {
            try {
                PendingMessagesSummary summary = redisTemplate.opsForStream().pending(stream, group);
                if (summary == null) {
                    continue;
                }
                log.info("Stream pending metrics stream={} group={} total={} minId={} maxId={}",
                        stream, group, summary.getTotalPendingMessages(),
                        summary.getMinMessageId(), summary.getMaxMessageId());
            } catch (Exception ex) {
                log.warn("Failed to read pending metrics for stream={}", stream, ex);
            }
        }
    }
}
