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
        log.info("[SSE] Creating new SSE emitter for userId: {}", userId);

        // Remove existing emitter if present
        SseEmitter existingEmitter = emitters.get(userId);
        if (existingEmitter != null) {
            log.info("[SSE] Removing existing emitter for userId: {} before creating new one", userId);
            removeEmitter(userId);
        }

        // Create new emitter with timeout
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        log.debug("[SSE] Created new SseEmitter with timeout: {} ms for userId: {}", SSE_TIMEOUT_MS, userId);

        // Set up callbacks for emitter lifecycle
        emitter.onCompletion(() -> {
            log.info("[SSE] Connection completed gracefully for userId: {}", userId);
            removeEmitter(userId);
        });

        emitter.onTimeout(() -> {
            log.warn("[SSE] Connection timed out after {} ms for userId: {}", SSE_TIMEOUT_MS, userId);
            removeEmitter(userId);
        });

        emitter.onError((ex) -> {
            log.error("[SSE] Connection error occurred for userId: {} - Error: {}", userId, ex.getMessage(), ex);
            removeEmitter(userId);
        });

        // Store the emitter with timestamp
        emitters.put(userId, emitter);
        emitterTimestamps.put(userId, System.currentTimeMillis());
        log.info("[SSE] Successfully registered SSE emitter for userId: {}. Total active connections: {}", userId, emitters.size());

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
                log.info("[SSE] Successfully removed and completed emitter for userId: {}. Remaining active connections: {}", userId, emitters.size());
            } catch (Exception e) {
                log.warn("[SSE] Error completing emitter for userId: {} - {}", userId, e.getMessage());
            }
        } else {
            log.debug("[SSE] Attempted to remove non-existent emitter for userId: {}", userId);
        }
    }

    private void sendInitialCount(Long userId, SseEmitter emitter) {
        log.info("[SSE] Sending initial unread count for userId: {}", userId);

        String redisKey = String.format(UNREAD_COUNT_KEY_PATTERN, userId);
        Long count = null;

        try {
            // Try fetching count from Redis first
            String countStr = stringRedisTemplate.opsForValue().get(redisKey);

            if (countStr != null && !countStr.isEmpty()) {
                try {
                    count = Long.parseLong(countStr);
                    log.debug("[SSE] Found cached unread count in Redis for userId: {}, count: {}", userId, count);
                } catch (NumberFormatException e) {
                    log.warn("[SSE] Failed to parse Redis count value '{}' for userId: {}, will query database", countStr, userId);
                }
            } else {
                log.debug("[SSE] No cached count found in Redis for userId: {}, querying database", userId);
            }

            // If not found in Redis or parse error, query database
            if (count == null) {
                count = notificationRepository.countByRecipientUserUserIdAndIsReadFalse(userId);
                log.info("[SSE] Queried database for unread count for userId: {}, count: {}", userId, count);

                // Cache the count in Redis with TTL
                try {
                    stringRedisTemplate.opsForValue().set(redisKey, count.toString(), REDIS_TTL_HOURS, TimeUnit.HOURS);
                    log.debug("[SSE] Cached unread count in Redis for userId: {} with TTL of {} hours", userId, REDIS_TTL_HOURS);
                } catch (Exception e) {
                    log.error("[SSE] Failed to cache count in Redis for userId: {} - {}", userId, e.getMessage());
                    // Continue without caching - not critical
                }
            }

            // Send the count to the client as initial broadcast
            sendCountToEmitter(emitter, count);
            log.info("[SSE] Successfully sent initial unread count {} to userId: {}", count, userId);

        } catch (Exception e) {
            log.error("[SSE] Error fetching initial count for userId: {} - {}", userId, e.getMessage(), e);
            // Send zero as fallback
            try {
                sendCountToEmitter(emitter, 0L);
                log.warn("[SSE] Sent fallback count of 0 to userId: {} due to error", userId);
            } catch (Exception fallbackError) {
                log.error("[SSE] Failed to send fallback count for userId: {} - {}", userId, fallbackError.getMessage());
            }
        }
    }

    @Override
    public void sendCountUpdate(Long userId, Long count) {
        log.info("[SSE] Broadcasting count update for userId: {}, newCount: {}", userId, count);

        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                sendCountToEmitter(emitter, count);
                log.info("[SSE] Successfully broadcasted count update {} to userId: {}", count, userId);
            } catch (Exception e) {
                log.error("[SSE] Failed to broadcast count update to userId: {} - {}", userId, e.getMessage(), e);
            }
        } else {
            log.debug("[SSE] No active SSE connection for userId: {}, skipping count broadcast for value: {}", userId, count);
        }
    }

    private void sendCountToEmitter(SseEmitter emitter, Long count) {
        try {
            log.debug("[SSE] Sending SSE event 'unseen-count' with value: {}", count);
            emitter.send(SseEmitter.event()
                    .name("unseen-count")
                    .data(count));
            log.debug("[SSE] Successfully sent count: {} via SSE", count);
        } catch (IOException e) {
            log.error("[SSE] IOException while sending count via SSE - {}", e.getMessage(), e);
            emitter.completeWithError(e);
            throw new RuntimeException("Failed to send SSE event", e);
        }
    }

    private void cleanupStaleConnections() {
        long currentTime = System.currentTimeMillis();
        int removedCount = 0;

        log.debug("[SSE] Starting cleanup of stale connections. Current active connections: {}", emitters.size());

        for (Map.Entry<Long, Long> entry : emitterTimestamps.entrySet()) {
            Long userId = entry.getKey();
            Long timestamp = entry.getValue();
            long age = currentTime - timestamp;

            if (age > SSE_TIMEOUT_MS) {
                log.info("[SSE] Cleaning up stale SSE connection for userId: {} (age: {} ms, timeout: {} ms)",
                        userId, age, SSE_TIMEOUT_MS);
                removeEmitter(userId);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            log.info("[SSE] Cleanup completed - removed {} stale connections. Remaining connections: {}",
                    removedCount, emitters.size());
        } else {
            log.debug("[SSE] Cleanup completed - no stale connections found. Active connections: {}", emitters.size());
        }
    }
}