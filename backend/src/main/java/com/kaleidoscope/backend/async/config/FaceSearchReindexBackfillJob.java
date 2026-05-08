package com.kaleidoscope.backend.async.config;

import com.kaleidoscope.backend.async.service.RedisStreamPublisher;
import com.kaleidoscope.backend.readmodels.repository.FaceSearchReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class FaceSearchReindexBackfillJob implements CommandLineRunner {

    private final FaceSearchReadModelRepository faceSearchReadModelRepository;
    private final RedisStreamPublisher redisStreamPublisher;

    @Value("${async.stream.face-search-backfill-enabled:false}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled) {
            return;
        }

        log.info("Starting face search reindex backfill...");
        long published = 0L;
        for (var row : faceSearchReadModelRepository.findAll()) {
            if (row.getFaceId() == null || row.getFaceId().isBlank()) {
                continue;
            }
            Map<String, String> payload = new HashMap<>();
            payload.put("indexType", "face_search");
            payload.put("documentId", row.getFaceId());
            payload.put("operation", "index");
            payload.put("correlationId", "face-search-backfill");
            payload.put("timestamp", Instant.now().toString());
            redisStreamPublisher.publish("es-sync-queue", payload);
            published++;
        }
        log.info("Face search reindex backfill published {} event(s)", published);
    }
}
