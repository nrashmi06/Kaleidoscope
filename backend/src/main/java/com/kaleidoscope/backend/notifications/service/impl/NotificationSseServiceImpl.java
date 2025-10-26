package com.kaleidoscope.backend.notifications.service.impl;

import com.kaleidoscope.backend.notifications.repository.NotificationRepository;
import com.kaleidoscope.backend.notifications.service.NotificationSseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class NotificationSseServiceImpl implements NotificationSseService {

    private final StringRedisTemplate stringRedisTemplate;
    private final NotificationRepository notificationRepository;

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final Map<Long, Long> emitterTimestamps = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    private static final String UNREAD_COUNT_KEY_PATTERN = "user:%d:notifications:unseen_count";
    private static final long REDIS_TTL_HOURS = 24;
    private static final long SSE_TIMEOUT_MS = 3600000L; // 1 hour timeout for SSE connections
    private static final long CLEANUP_INTERVAL_MS = 300000L; // 5 minutes cleanup interval

    public NotificationSseServiceImpl(StringRedisTemplate stringRedisTemplate,
                                      NotificationRepository notificationRepository) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.notificationRepository = notificationRepository;

        // Schedule periodic cleanup of stale connections
        scheduler.scheduleAtFixedRate(this::cleanupStaleConnections,
                CLEANUP_INTERVAL_MS, CLEANUP_INTERVAL_MS, TimeUnit.MILLISECONDS);
        log.info("NotificationSseService initialized with automatic cleanup every {} ms", CLEANUP_INTERVAL_MS);
    }

    @Override
    public SseEmitter createEmitter(Long userId) {
        log.info("Creating SSE emitter for userId: {}", userId);

        // Remove existing emitter if present
        removeEmitter(userId);

        // Create new emitter with timeout
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        // Set up callbacks for emitter lifecycle
        emitter.onCompletion(() -> {
            log.info("SSE connection completed for userId: {}", userId);
            removeEmitter(userId);
        });

        emitter.onTimeout(() -> {
            log.warn("SSE connection timed out for userId: {}", userId);
            removeEmitter(userId);
        });

        emitter.onError((ex) -> {
            log.error("SSE connection error for userId: {}", userId, ex);
            removeEmitter(userId);
        });

        // Store the emitter with timestamp
        emitters.put(userId, emitter);
        emitterTimestamps.put(userId, System.currentTimeMillis());
        log.info("Registered SSE emitter for userId: {}. Total active connections: {}", userId, emitters.size());

        // Send initial count immediately after registration
        sendInitialCount(userId, emitter);

        return emitter;
    }

    @Override
    public void removeEmitter(Long userId) {
        SseEmitter removed = emitters.remove(userId);
        emitterTimestamps.remove(userId);

        if (removed != null) {
            try {
                removed.complete();
            } catch (Exception e) {
                log.debug("Error completing emitter for userId: {}", userId, e);
            }
            log.info("Removed SSE emitter for userId: {}. Remaining active connections: {}", userId, emitters.size());
        }
    }

    private void sendInitialCount(Long userId, SseEmitter emitter) {
        log.debug("Sending initial count for userId: {}", userId);

        String redisKey = String.format(UNREAD_COUNT_KEY_PATTERN, userId);
        Long count = null;

        try {
            // Try fetching count from Redis first
            String countStr = stringRedisTemplate.opsForValue().get(redisKey);

            if (countStr != null && !countStr.isEmpty()) {
                try {
                    count = Long.parseLong(countStr);
                    log.debug("Found cached unread count in Redis for userId: {}, count: {}", userId, count);
                } catch (NumberFormatException e) {
                    log.warn("Failed to parse Redis count value '{}' for userId: {}, will query database", countStr, userId);
                }
            }

            // If not found in Redis or parse error, query database
            if (count == null) {
                count = notificationRepository.countByRecipientUserUserIdAndIsReadFalse(userId);
                log.debug("Queried database for unread count for userId: {}, count: {}", userId, count);

                // Cache the count in Redis with TTL
                try {
                    stringRedisTemplate.opsForValue().set(redisKey, count.toString(), REDIS_TTL_HOURS, TimeUnit.HOURS);
                    log.debug("Cached unread count in Redis for userId: {} with TTL of {} hours", userId, REDIS_TTL_HOURS);
                } catch (Exception e) {
                    log.error("Failed to cache count in Redis for userId: {}", userId, e);
                    // Continue without caching - not critical
                }
            }

            // Send the count to the client as initial broadcast
            sendCountToEmitter(emitter, count);
            log.info("Sent initial unread count {} to userId: {}", count, userId);

        } catch (Exception e) {
            log.error("Error fetching initial count for userId: {}", userId, e);
            // Send zero as fallback
            try {
                sendCountToEmitter(emitter, 0L);
            } catch (Exception fallbackError) {
                log.error("Failed to send fallback count for userId: {}", userId, fallbackError);
            }
        }
    }

    @Override
    public void sendCountUpdate(Long userId, Long count) {
        log.debug("Broadcasting count update for userId: {}, count: {}", userId, count);

        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            sendCountToEmitter(emitter, count);
            log.debug("Successfully broadcasted count update to userId: {}", userId);
        } else {
            log.debug("No active SSE connection for userId: {}, skipping count broadcast", userId);
        }
    }

    private void sendCountToEmitter(SseEmitter emitter, Long count) {
        try {
            emitter.send(SseEmitter.event()
                    .name("unseen-count")
                    .data(count));
            log.debug("Successfully sent count: {} via SSE", count);
        } catch (IOException e) {
            log.error("Failed to send count via SSE", e);
            emitter.completeWithError(e);
        }
    }

    private void cleanupStaleConnections() {
        long currentTime = System.currentTimeMillis();
        int removedCount = 0;

        for (Map.Entry<Long, Long> entry : emitterTimestamps.entrySet()) {
            Long userId = entry.getKey();
            Long timestamp = entry.getValue();

            if (currentTime - timestamp > SSE_TIMEOUT_MS) {
                log.info("Cleaning up stale SSE connection for userId: {} (age: {} ms)",
                        userId, currentTime - timestamp);
                removeEmitter(userId);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            log.info("Cleaned up {} stale SSE connections. Remaining connections: {}",
                    removedCount, emitters.size());
        }
    }
}