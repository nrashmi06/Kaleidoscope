package com.kaleidoscope.backend.notifications.controller.api;

import com.kaleidoscope.backend.notifications.dto.response.NotificationResponseDTO;
import com.kaleidoscope.backend.shared.response.AppResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@Tag(name = "Notification", description = "APIs for managing notifications and real-time updates via Server-Sent Events")
public interface NotificationApi {

    @Operation(
            summary = "Stream notification count updates",
            description = "Establishes a Server-Sent Events (SSE) connection to receive real-time unread notification count updates. " +
                    "Authentication is performed via query parameter 'token' containing a valid JWT token. " +
                    "The stream sends events named 'unseen-count' with the current unread notification count."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "SSE connection established successfully. Events will be sent with name 'unseen-count'",
                    content = @Content(mediaType = "text/event-stream")
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - Invalid or missing JWT token"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - Token is valid but user doesn't have access"
            )
    })
    SseEmitter streamNotifications();

    @Operation(
            summary = "Get notifications",
            description = "Retrieves paginated list of notifications for the authenticated user. " +
                    "Can be filtered by read status and sorted by creation date."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notifications retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - User not authenticated"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User doesn't have access")
    })
    ResponseEntity<AppResponse<Map<String, Object>>> getNotifications(
            @Parameter(description = "Filter by read status (true/false). If not provided, returns all notifications")
            Boolean isRead,
            @Parameter(hidden = true) Pageable pageable
    );

    @Operation(
            summary = "Mark notification as read",
            description = "Marks a specific notification as read and updates the unread count"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification marked as read successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - User not authenticated"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User doesn't own this notification"),
            @ApiResponse(responseCode = "404", description = "Notification not found")
    })
    ResponseEntity<AppResponse<NotificationResponseDTO>> markNotificationRead(
            @Parameter(description = "ID of the notification to mark as read") Long notificationId
    );

    @Operation(
            summary = "Mark all notifications as read",
            description = "Marks all notifications for the authenticated user as read and resets the unread count to zero"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All notifications marked as read successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - User not authenticated")
    })
    ResponseEntity<AppResponse<Map<String, Object>>> markAllNotificationsRead();

    @Operation(
            summary = "Delete notification",
            description = "Permanently deletes a notification. If the notification was unread, decrements the unread count."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - User not authenticated"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User doesn't own this notification"),
            @ApiResponse(responseCode = "404", description = "Notification not found")
    })
    ResponseEntity<AppResponse<Object>> deleteNotification(
            @Parameter(description = "ID of the notification to delete") Long notificationId
    );
}
