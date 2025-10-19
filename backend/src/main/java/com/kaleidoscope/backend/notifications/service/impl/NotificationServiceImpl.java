package com.kaleidoscope.backend.notifications.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.notifications.dto.response.NotificationResponseDTO;
import com.kaleidoscope.backend.notifications.exception.NotificationNotFoundException;
import com.kaleidoscope.backend.notifications.mapper.NotificationMapper;
import com.kaleidoscope.backend.notifications.model.Notification;
import com.kaleidoscope.backend.notifications.repository.NotificationRepository;
import com.kaleidoscope.backend.notifications.service.NotificationService;
import com.kaleidoscope.backend.notifications.service.NotificationSseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final JwtUtils jwtUtils;
    private final StringRedisTemplate stringRedisTemplate;
    private final NotificationSseService notificationSseService;
    private final NotificationMapper notificationMapper;

    private static final String UNREAD_COUNT_KEY_PATTERN = "user:%d:notifications:unseen_count";
    private static final long REDIS_TTL_HOURS = 24;

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponseDTO> getNotifications(Boolean isReadFilter, Pageable pageable) {
        Long userId = jwtUtils.getUserIdFromContext();
        log.info("Fetching notifications for userId: {}, isReadFilter: {}", userId, isReadFilter);

        Page<Notification> notificationsPage;

        if (isReadFilter != null) {
            notificationsPage = notificationRepository.findByRecipientUserUserIdAndIsRead(userId, isReadFilter, pageable);
        } else {
            notificationsPage = notificationRepository.findByRecipientUserUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        log.debug("Found {} notifications for userId: {}", notificationsPage.getTotalElements(), userId);

        return notificationsPage.map(notificationMapper::toResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        Long userId = jwtUtils.getUserIdFromContext();
        log.debug("Getting unread count for userId: {}", userId);

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

            return count;

        } catch (Exception e) {
            log.error("Error fetching unread count for userId: {}", userId, e);
            // Fallback to database query
            return notificationRepository.countByRecipientUserUserIdAndIsReadFalse(userId);
        }
    }

    @Override
    @Transactional
    public NotificationResponseDTO markAsRead(Long notificationId) {
        Long userId = jwtUtils.getUserIdFromContext();
        log.info("Marking notification as read - notificationId: {}, userId: {}", notificationId, userId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));

        // Check ownership
        if (!notification.getRecipientUser().getUserId().equals(userId)) {
            log.warn("Access denied: userId {} attempted to mark notification {} owned by userId {}",
                    userId, notificationId, notification.getRecipientUser().getUserId());
            throw new AccessDeniedException("You do not have permission to modify this notification");
        }

        // Only update if notification is currently unread
        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
            log.info("Notification {} marked as read", notificationId);

            // Decrement unread count in Redis
            String countKey = String.format(UNREAD_COUNT_KEY_PATTERN, userId);
            Long newCount = stringRedisTemplate.opsForValue().decrement(countKey);

            // Ensure count doesn't go negative
            if (newCount != null && newCount < 0) {
                stringRedisTemplate.opsForValue().set(countKey, "0");
                newCount = 0L;
            }

            // Send SSE update
            notificationSseService.sendCountUpdate(userId, newCount != null ? newCount : 0L);
            log.debug("Updated unread count to {} for userId: {}", newCount, userId);
        } else {
            log.debug("Notification {} was already read, skipping update", notificationId);
        }

        return notificationMapper.toResponseDTO(notification);
    }

    @Override
    @Transactional
    public int markAllAsRead() {
        Long userId = jwtUtils.getUserIdFromContext();
        log.info("Marking all notifications as read for userId: {}", userId);

        int updatedCount = notificationRepository.markAllAsReadForUser(userId);
        log.info("Marked {} notifications as read for userId: {}", updatedCount, userId);

        if (updatedCount > 0) {
            // Reset unread count in Redis
            String countKey = String.format(UNREAD_COUNT_KEY_PATTERN, userId);
            stringRedisTemplate.opsForValue().set(countKey, "0", REDIS_TTL_HOURS, TimeUnit.HOURS);

            // Send SSE update
            notificationSseService.sendCountUpdate(userId, 0L);
            log.debug("Reset unread count to 0 for userId: {}", userId);
        }

        return updatedCount;
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId) {
        Long userId = jwtUtils.getUserIdFromContext();
        log.info("Deleting notification - notificationId: {}, userId: {}", notificationId, userId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));

        // Check ownership
        if (!notification.getRecipientUser().getUserId().equals(userId)) {
            log.warn("Access denied: userId {} attempted to delete notification {} owned by userId {}",
                    userId, notificationId, notification.getRecipientUser().getUserId());
            throw new AccessDeniedException("You do not have permission to delete this notification");
        }

        boolean wasUnread = !notification.getIsRead();
        notificationRepository.deleteById(notificationId);
        log.info("Deleted notification {}", notificationId);

        // If the notification was unread, decrement the count
        if (wasUnread) {
            String countKey = String.format(UNREAD_COUNT_KEY_PATTERN, userId);
            Long newCount = stringRedisTemplate.opsForValue().decrement(countKey);

            // Ensure count doesn't go negative
            if (newCount != null && newCount < 0) {
                stringRedisTemplate.opsForValue().set(countKey, "0");
                newCount = 0L;
            }

            // Send SSE update
            notificationSseService.sendCountUpdate(userId, newCount != null ? newCount : 0L);
            log.debug("Updated unread count to {} for userId: {} after deletion", newCount, userId);
        }
    }
}