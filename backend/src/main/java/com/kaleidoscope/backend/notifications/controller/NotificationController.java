package com.kaleidoscope.backend.notifications.controller;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.notifications.controller.api.NotificationApi;
import com.kaleidoscope.backend.notifications.dto.response.NotificationResponseDTO;
import com.kaleidoscope.backend.notifications.routes.NotificationRoutes;
import com.kaleidoscope.backend.notifications.service.NotificationService;
import com.kaleidoscope.backend.notifications.service.NotificationSseService;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class NotificationController implements NotificationApi {

    private final NotificationSseService notificationSseService;
    private final NotificationService notificationService;
    private final JwtUtils jwtUtils;

    @Override
    @GetMapping(value = NotificationRoutes.STREAM, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    // Note: Authentication is handled by SseAuthenticationFilter, not @PreAuthorize
    // Using @PreAuthorize here causes race condition with async SSE response
    public SseEmitter streamNotifications() {
        // Get userId from the SecurityContext which was populated by SseAuthenticationFilter
        Long userId = jwtUtils.getUserIdFromContext();
        
        log.info("SSE stream request received for userId: {}", userId);
        
        return notificationSseService.createEmitter(userId);
    }

    @Override
    @GetMapping(NotificationRoutes.GET_NOTIFICATIONS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<Map<String, Object>>> getNotifications(
            @RequestParam(required = false) Boolean isRead,
            @Parameter(hidden = true) @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("Fetching notifications with isRead filter: {}, page: {}", isRead, pageable.getPageNumber());

        Page<NotificationResponseDTO> pageResult = notificationService.getNotifications(isRead, pageable);
        long unreadCount = notificationService.getUnreadCount();

        PaginatedResponse<NotificationResponseDTO> paginatedResponse = PaginatedResponse.fromPage(pageResult);
        Map<String, Object> responseData = Map.of(
                "notifications", paginatedResponse,
                "unreadCount", unreadCount
        );

        return ResponseEntity.ok(
                AppResponse.<Map<String, Object>>builder()
                        .success(true)
                        .message("Notifications retrieved successfully")
                        .data(responseData)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(NotificationRoutes.GET_NOTIFICATIONS)
                        .build()
        );
    }

    @Override
    @PatchMapping(NotificationRoutes.MARK_AS_READ)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<NotificationResponseDTO>> markNotificationRead(
            @PathVariable Long notificationId) {

        log.info("Marking notification as read - notificationId: {}", notificationId);

        NotificationResponseDTO updatedDto = notificationService.markAsRead(notificationId);

        return ResponseEntity.ok(
                AppResponse.<NotificationResponseDTO>builder()
                        .success(true)
                        .message("Notification marked as read")
                        .data(updatedDto)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(NotificationRoutes.MARK_AS_READ.replace("{notificationId}", notificationId.toString()))
                        .build()
        );
    }

    @Override
    @PatchMapping(NotificationRoutes.MARK_ALL_AS_READ)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<Map<String, Object>>> markAllNotificationsRead() {

        log.info("Marking all notifications as read");

        int updatedCount = notificationService.markAllAsRead();

        return ResponseEntity.ok(
                AppResponse.<Map<String, Object>>builder()
                        .success(true)
                        .message("All notifications marked as read")
                        .data(Map.of("markedReadCount", updatedCount))
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(NotificationRoutes.MARK_ALL_AS_READ)
                        .build()
        );
    }

    @Override
    @DeleteMapping(NotificationRoutes.DELETE_NOTIFICATION)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<Object>> deleteNotification(
            @PathVariable Long notificationId) {

        log.info("Deleting notification - notificationId: {}", notificationId);

        notificationService.deleteNotification(notificationId);

        return ResponseEntity.ok(
                AppResponse.builder()
                        .success(true)
                        .message("Notification deleted successfully")
                        .data(null)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(NotificationRoutes.DELETE_NOTIFICATION.replace("{notificationId}", notificationId.toString()))
                        .build()
        );
    }
}
