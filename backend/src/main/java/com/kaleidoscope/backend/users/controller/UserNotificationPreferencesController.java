package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserNotificationPreferencesResponseDTO;
import com.kaleidoscope.backend.users.routes.UserNotificationPreferencesRoutes;
import com.kaleidoscope.backend.users.service.UserNotificationPreferencesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "User Notification Preferences", description = "APIs for managing user notification preferences")
public class UserNotificationPreferencesController {

    private final UserNotificationPreferencesService notificationPreferencesService;

    @Operation(summary = "Get notification preferences", description = "Retrieves the notification preferences for the current or specified user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notification preferences retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping(value = {UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES,
                         UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES + "/{userId}"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> getNotificationPreferences(
            @Parameter(description = "User ID for which to retrieve preferences (optional)")
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

    @Operation(summary = "Get all notification preferences (Admin)", description = "Retrieves notification preferences for all users. Requires admin privileges.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All notification preferences retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping(UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES + "/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserNotificationPreferencesResponseDTO>>> getAllNotificationPreferences(
            @Parameter(description = "Pagination information")
            Pageable pageable) {

        Page<UserNotificationPreferencesResponseDTO> response =
                notificationPreferencesService.getAllNotificationPreferences(pageable);

        return ResponseEntity.ok(
                ApiResponse.success(response, "All notification preferences retrieved successfully",
                        UserNotificationPreferencesRoutes.GET_NOTIFICATION_PREFERENCES + "/admin/all")
        );
    }

    @Operation(summary = "Update notification preferences", description = "Updates the current user's notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notification preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PutMapping(UserNotificationPreferencesRoutes.UPDATE_NOTIFICATION_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateNotificationPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update notification preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateNotificationPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateNotificationPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateNotificationPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_NOTIFICATION_PREFERENCES)
        );
    }

    @Operation(summary = "Update likes notification preferences", description = "Updates the user's likes notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Likes preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_LIKES_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateLikesPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update likes preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateLikesPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateLikesPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateLikesPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Likes notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_LIKES_PREFERENCES)
        );
    }

    @Operation(summary = "Update comments notification preferences", description = "Updates the user's comments notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comments preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_COMMENTS_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateCommentsPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update comments preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateCommentsPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateCommentsPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateCommentsPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Comments notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_COMMENTS_PREFERENCES)
        );
    }

    @Operation(summary = "Update follows notification preferences", description = "Updates the user's follows notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Follows preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_FOLLOWS_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateFollowsPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update follows preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateFollowsPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateFollowsPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateFollowsPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Follows notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_FOLLOWS_PREFERENCES)
        );
    }

    @Operation(summary = "Update mentions notification preferences", description = "Updates the user's mentions notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Mentions preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_MENTIONS_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateMentionsPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update mentions preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateMentionsPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateMentionsPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateMentionsPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Mentions notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_MENTIONS_PREFERENCES)
        );
    }

    @Operation(summary = "Update system notification preferences", description = "Updates the user's system notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "System preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_SYSTEM_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateSystemPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update system preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateSystemPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateSystemPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateSystemPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "System notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_SYSTEM_PREFERENCES)
        );
    }

    @Operation(summary = "Update email notification preferences", description = "Updates the user's email notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Email preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_EMAIL_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateEmailPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update email preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateEmailPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateEmailPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updateEmailPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Email notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_EMAIL_PREFERENCES)
        );
    }

    @Operation(summary = "Update push notification preferences", description = "Updates the user's push notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Push preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserNotificationPreferencesRoutes.UPDATE_PUSH_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updatePushPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update push preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdatePushPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdatePushPreferencesRequestDTO requestDTO) {

        UserNotificationPreferencesResponseDTO response =
                notificationPreferencesService.updatePushPreferences(requestDTO);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Push notification preferences updated successfully",
                        UserNotificationPreferencesRoutes.UPDATE_PUSH_PREFERENCES)
        );
    }

    @Operation(summary = "Enable all email notifications", description = "Enables all email notification types for the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All email notifications enabled successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
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

    @Operation(summary = "Disable all email notifications", description = "Disables all email notification types for the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All email notifications disabled successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
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

    @Operation(summary = "Enable all push notifications", description = "Enables all push notification types for the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All push notifications enabled successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
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

    @Operation(summary = "Disable all push notifications", description = "Disables all push notification types for the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All push notifications disabled successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
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

    @Operation(summary = "Reset notification preferences to defaults", description = "Resets the user's notification preferences to default settings.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notification preferences reset to defaults successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
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
