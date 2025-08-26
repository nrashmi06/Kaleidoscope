package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.controller.api.UserNotificationPreferencesApi;
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
public class UserNotificationPreferencesController implements UserNotificationPreferencesApi {

    private final UserNotificationPreferencesService notificationPreferencesService;

    @Override
    @GetMapping(value = {UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES,
                         UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES + "/{userId}"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> getNotificationPreferences(
            @PathVariable(required = false) Long userId) {

        UserNotificationPreferencesResponseDTO response;
        String responsePath;

        if (userId == null) {
            response = notificationPreferencesService.getNotificationPreferences();
            responsePath = UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES;
        } else {
            response = notificationPreferencesService.getNotificationPreferencesByUserId(userId);
            responsePath = UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES + "/" + userId;
        }

        return ResponseEntity.ok(
                ApiResponse.success(response, "Notification preferences retrieved successfully", responsePath)
        );
    }

    @Override
    @GetMapping(UserNotificationPreferencesRoutes.GET_ALL_NOTIFICATION_PREFERENCES)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserNotificationPreferencesResponseDTO>>> getAllNotificationPreferences(
            Pageable pageable) {

        Page<UserNotificationPreferencesResponseDTO> response =
                notificationPreferencesService.getAllNotificationPreferences(pageable);

        return ResponseEntity.ok(
                ApiResponse.success(response, "All notification preferences retrieved successfully",
                        UserNotificationPreferencesRoutes.GET_ALL_NOTIFICATION_PREFERENCES)
        );
    }

    @Override
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

    @Override
    @PatchMapping(UserNotificationPreferencesRoutes.PARTIAL_UPDATE_NOTIFICATION_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> partialUpdateNotificationPreferences(
            @Valid @RequestBody PartialUpdateNotificationPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.partialUpdateNotificationPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.PARTIAL_UPDATE_NOTIFICATION_PREFERENCES)
        );
    }

    @Override
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
