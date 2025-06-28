package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserNotificationPreferencesResponseDTO;
import com.kaleidoscope.backend.users.routes.UserNotificationPreferencesRoutes;
import com.kaleidoscope.backend.users.service.UserNotificationPreferencesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Slf4j
public class UserNotificationPreferencesController {

    private final UserNotificationPreferencesService notificationPreferencesService;

    @GetMapping(value = {UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES,
                         UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES + "/{userId}"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> getNotificationPreferences(
            @PathVariable(required = false) Long userId) {

        UserNotificationPreferencesResponseDTO response;
        String responsePath;

        if (userId == null) {
            // Get current user's notification preferences
            response = notificationPreferencesService.getNotificationPreferences();
            responsePath = UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES;
        } else {
            // Service will handle all authorization checks
            response = notificationPreferencesService.getNotificationPreferencesByUserId(userId);
            responsePath = UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES + "/" + userId;
        }

        return ResponseEntity.ok(
                ApiResponse.success(response, "Notification preferences retrieved successfully", responsePath)
        );
    }

    @GetMapping(UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES + "/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserNotificationPreferencesResponseDTO>>> getAllNotificationPreferences(
            Pageable pageable) {

        Page<UserNotificationPreferencesResponseDTO> response =
                notificationPreferencesService.getAllNotificationPreferences(pageable);

        return ResponseEntity.ok(
                ApiResponse.success(response, "All notification preferences retrieved successfully",
                        UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES + "/admin/all")
        );
    }

    @PutMapping(UserNotificationPreferencesRoutes.UPDATE_NOTIFICATION_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateNotificationPreferences(
            @Valid @RequestBody UpdateNotificationPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateNotificationPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_NOTIFICATION_PREFERENCES)
        );
    }

    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_LIKES_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateLikesPreferences(
            @Valid @RequestBody UpdateLikesPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateLikesPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Likes notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_LIKES_PREFERENCES)
        );
    }

    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_COMMENTS_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateCommentsPreferences(
            @Valid @RequestBody UpdateCommentsPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateCommentsPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Comments notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_COMMENTS_PREFERENCES)
        );
    }

    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_FOLLOWS_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateFollowsPreferences(
            @Valid @RequestBody UpdateFollowsPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateFollowsPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Follows notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_FOLLOWS_PREFERENCES)
        );
    }

    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_MENTIONS_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateMentionsPreferences(
            @Valid @RequestBody UpdateMentionsPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateMentionsPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Mentions notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_MENTIONS_PREFERENCES)
        );
    }

    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_SYSTEM_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateSystemPreferences(
            @Valid @RequestBody UpdateSystemPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateSystemPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "System notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_SYSTEM_PREFERENCES)
        );
    }

    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_EMAIL_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateEmailPreferences(
            @Valid @RequestBody UpdateEmailPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateEmailPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Email notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_EMAIL_PREFERENCES)
        );
    }

    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_PUSH_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updatePushPreferences(
            @Valid @RequestBody UpdatePushPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updatePushPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Push notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_PUSH_PREFERENCES)
        );
    }

    @PostMapping(UserNotificationPreferencesRoutes.ENABLE_ALL_EMAIL)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> enableAllEmailNotifications() {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.enableAllEmailNotifications();

        return ResponseEntity.ok(
                ApiResponse.success(response, "All email notifications enabled successfully",
                        UserNotificationPreferencesRoutes.ENABLE_ALL_EMAIL)
        );
    }

    @PostMapping(UserNotificationPreferencesRoutes.DISABLE_ALL_EMAIL)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> disableAllEmailNotifications() {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.disableAllEmailNotifications();

        return ResponseEntity.ok(
                ApiResponse.success(response, "All email notifications disabled successfully",
                        UserNotificationPreferencesRoutes.DISABLE_ALL_EMAIL)
        );
    }

    @PostMapping(UserNotificationPreferencesRoutes.ENABLE_ALL_PUSH)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> enableAllPushNotifications() {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.enableAllPushNotifications();

        return ResponseEntity.ok(
                ApiResponse.success(response, "All push notifications enabled successfully",
                        UserNotificationPreferencesRoutes.ENABLE_ALL_PUSH)
        );
    }

    @PostMapping(UserNotificationPreferencesRoutes.DISABLE_ALL_PUSH)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> disableAllPushNotifications() {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.disableAllPushNotifications();

        return ResponseEntity.ok(
                ApiResponse.success(response, "All push notifications disabled successfully",
                        UserNotificationPreferencesRoutes.DISABLE_ALL_PUSH)
        );
    }

    @PostMapping(UserNotificationPreferencesRoutes.RESET_TO_DEFAULTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> resetToDefaults() {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.resetToDefaults();

        return ResponseEntity.ok(
                ApiResponse.success(response, "Notification preferences reset to defaults successfully",
                        UserNotificationPreferencesRoutes.RESET_TO_DEFAULTS)
        );
    }
}
