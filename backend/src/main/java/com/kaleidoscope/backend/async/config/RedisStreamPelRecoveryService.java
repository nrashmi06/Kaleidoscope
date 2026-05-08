package com.kaleidoscope.backend.async.config;

import com.kaleidoscope.backend.async.consumer.*;
import com.kaleidoscope.backend.async.streaming.ConsumerStreamConstants;
import com.kaleidoscope.backend.async.streaming.StreamingConfigConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.scheduling.annotation.Async;
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

    private final MediaAiInsightsConsumer mediaAiInsightsConsumer;
    private final FaceDetectionConsumer faceDetectionConsumer;
    private final FaceRecognitionConsumer faceRecognitionConsumer;
    private final PostInsightsEnrichedConsumer postInsightsEnrichedConsumer;

    @Value("${spring.application.name:kaleidoscope-backend}")
    private String appName;

    private static final Duration MIN_IDLE      = Duration.ofSeconds(60);
    private static final int     CLAIM_BATCH    = 50;
    private static final long    METRICS_BATCH  = 1_000L;

    /** Single source of truth for all managed streams. */
    private List<Map.Entry<String, StreamListener<String, MapRecord<String, String, String>>>> streamListeners() {
        return List.of(
                Map.entry(ConsumerStreamConstants.ML_INSIGHTS_STREAM,         mediaAiInsightsConsumer),
                Map.entry(ConsumerStreamConstants.FACE_DETECTION_STREAM,      faceDetectionConsumer),
                Map.entry(ConsumerStreamConstants.FACE_RECOGNITION_STREAM,    faceRecognitionConsumer),
                Map.entry(ConsumerStreamConstants.POST_INSIGHTS_ENRICHED_STREAM, postInsightsEnrichedConsumer)
        );
    }

    // -----------------------------------------------------------------------
    // Recovery
    // -----------------------------------------------------------------------

    /**
     * Runs once at startup (async so it does not delay Spring context refresh).
     * Requires @EnableAsync on a @Configuration class.
     */
    @PostConstruct
    @Async
    public void recoverAtStartup() {
        log.info("PEL recovery – startup pass begin");
        recoverAllStreams();
        log.info("PEL recovery – startup pass complete");
    }

    /**
     * Periodic safety-net: picks up messages that get stuck after startup.
     * Interval configurable via async.stream.pel-recovery-ms (default 2 min).
     */
    @Scheduled(fixedDelayString = "${async.stream.pel-recovery-ms:120000}")
    public void recoverOnSchedule() {
        log.debug("PEL recovery – scheduled pass begin");
        recoverAllStreams();
    }

    private void recoverAllStreams() {
        for (Map.Entry<String, StreamListener<String, MapRecord<String, String, String>>> entry : streamListeners()) {
            recoverStream(entry.getKey(), entry.getValue());
        }
    }

    @SuppressWarnings("unchecked")
    private void recoverStream(
            String stream,
            StreamListener<String, MapRecord<String, String, String>> listener
    ) {
        String group            = StreamingConfigConstants.BACKEND_CONSUMER_GROUP;
        String recoveryConsumer = appName + "-pel-recovery";
        long   recovered        = 0L;

        try {
            // 1. Fetch pending summary for this stream / group
            PendingMessages pending = redisTemplate.opsForStream().pending(
                    stream,
                    group,
                    org.springframework.data.domain.Range.unbounded(),
                    CLAIM_BATCH
            );

            if (pending == null || pending.isEmpty()) {
                log.debug("PEL recovery – nothing pending stream={}", stream);
                return;
            }

            // 2. Keep only messages idle longer than MIN_IDLE
            List<RecordId> idsToClaim = pending.stream()
                    .filter(m -> m.getElapsedTimeSinceLastDelivery().compareTo(MIN_IDLE) > 0)
                    .map(PendingMessage::getId)
                    .toList();

            if (idsToClaim.isEmpty()) {
                log.debug("PEL recovery – no stale messages stream={}", stream);
                return;
            }

            log.info("PEL recovery – claiming {} stale message(s) stream={}", idsToClaim.size(), stream);

            // 3. Claim ownership – claim() returns List<MapRecord<String,Object,Object>>
            //    at the bytecode level regardless of the template's generic type,
            //    so an unchecked cast is required here.
            List<MapRecord<String, String, String>> records =
                    (List<MapRecord<String, String, String>>) (List<?>)
                    redisTemplate.opsForStream().claim(
                            stream,
                            group,
                            recoveryConsumer,
                            MIN_IDLE,
                            idsToClaim.toArray(new RecordId[0])
                    );

            if (records == null || records.isEmpty()) {
                log.debug("PEL recovery – claim returned empty stream={}", stream);
                return;
            }

            // 4. Re-run business logic then acknowledge
            for (MapRecord<String, String, String> record : records) {
                try {
                    listener.onMessage(record);

                    // acknowledge(stream, group, recordId...) – stream param is required
                    Long acked = redisTemplate.opsForStream()
                            .acknowledge(stream, group, record.getId());

                    log.info("PEL recovery – acked stream={} id={} acked={}",
                            stream, record.getId().getValue(), acked);
                    recovered++;
                } catch (Exception ex) {
                    log.error("PEL recovery – processing failed, left in PEL stream={} id={}",
                            stream, record.getId().getValue(), ex);
                }
            }

        } catch (Exception ex) {
            log.error("PEL recovery – unexpected error stream={}", stream, ex);
        }

        if (recovered > 0) {
            log.info("PEL recovery – summary stream={} recovered={}", stream, recovered);
        }
    }

    // -----------------------------------------------------------------------
    // Metrics
    // -----------------------------------------------------------------------

    /**
     * Logs PEL size for every stream periodically.
     * Interval configurable via async.stream.pending-metrics-ms (default 1 min).
     */
    @Scheduled(fixedDelayString = "${async.stream.pending-metrics-ms:60000}")
    public void logPendingMetrics() {
        String group = StreamingConfigConstants.BACKEND_CONSUMER_GROUP;

        for (Map.Entry<String, StreamListener<String, MapRecord<String, String, String>>> entry : streamListeners()) {
            String stream = entry.getKey();
            try {
                // Use the detailed form so we can derive min/max IDs ourselves.
                // PendingMessagesSummary only exposes getTotalPendingMessages() + getGroupName();
                // min/max IDs are not available on it.
                PendingMessages detail = redisTemplate.opsForStream().pending(
                        stream,
                        group,
                        org.springframework.data.domain.Range.unbounded(),
                        METRICS_BATCH
                );

                if (detail == null || detail.isEmpty()) {
                    log.debug("Pending metrics – nothing pending stream={} group={}", stream, group);
                    continue;
                }

                String minId = detail.stream()
                        .map(m -> m.getId().getValue())
                        .min(String::compareTo)
                        .orElse("-");

                String maxId = detail.stream()
                        .map(m -> m.getId().getValue())
                        .max(String::compareTo)
                        .orElse("-");

                log.info("Pending metrics stream={} group={} total={} minId={} maxId={}",
                        stream, group, detail.size(), minId, maxId);

            } catch (Exception ex) {
                log.warn("Pending metrics – failed to read stream={}", stream, ex);
            }
        }
    }
}