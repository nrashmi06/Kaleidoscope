package com.kaleidoscope.backend.users.controller.api;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserNotificationPreferencesResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

@Tag(name = "User Notification Preferences", description = "APIs for managing user notification preferences")
public interface UserNotificationPreferencesApi {

    @Operation(summary = "Get notification preferences", description = "Retrieves the notification preferences for the current or specified user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notification preferences retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> getNotificationPreferences(
            @Parameter(description = "User ID for which to retrieve preferences (optional)")
            @PathVariable(required = false) Long userId);

    @Operation(summary = "Get all notification preferences (Admin)", description = "Retrieves notification preferences for all users. Requires admin privileges.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All notification preferences retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    ResponseEntity<ApiResponse<Page<UserNotificationPreferencesResponseDTO>>> getAllNotificationPreferences(
            @Parameter(description = "Pagination information")
            Pageable pageable);

    @Operation(summary = "Update notification preferences", description = "Updates the current user's notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notification preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateNotificationPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update notification preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateNotificationPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateNotificationPreferencesRequestDTO requestDTO);

    @Operation(summary = "Update likes notification preferences", description = "Updates the user's likes notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Likes preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateLikesPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update likes preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateLikesPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateLikesPreferencesRequestDTO requestDTO);

    @Operation(summary = "Update comments notification preferences", description = "Updates the user's comments notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comments preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateCommentsPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update comments preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateCommentsPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateCommentsPreferencesRequestDTO requestDTO);

    @Operation(summary = "Update follows notification preferences", description = "Updates the user's follows notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Follows preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateFollowsPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update follows preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateFollowsPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateFollowsPreferencesRequestDTO requestDTO);

    @Operation(summary = "Update mentions notification preferences", description = "Updates the user's mentions notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Mentions preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateMentionsPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update mentions preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateMentionsPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateMentionsPreferencesRequestDTO requestDTO);

    @Operation(summary = "Update system notification preferences", description = "Updates the user's system notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "System preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateSystemPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update system preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateSystemPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateSystemPreferencesRequestDTO requestDTO);

    @Operation(summary = "Update email notification preferences", description = "Updates the user's email notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Email preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updateEmailPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update email preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateEmailPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateEmailPreferencesRequestDTO requestDTO);

    @Operation(summary = "Update push notification preferences", description = "Updates the user's push notification preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Push preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> updatePushPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update push preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdatePushPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdatePushPreferencesRequestDTO requestDTO);

    @Operation(summary = "Enable all email notifications", description = "Enables all email notification types for the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All email notifications enabled successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> enableAllEmailNotifications();

    @Operation(summary = "Disable all email notifications", description = "Disables all email notification types for the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All email notifications disabled successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> disableAllEmailNotifications();

    @Operation(summary = "Enable all push notifications", description = "Enables all push notification types for the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All push notifications enabled successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> enableAllPushNotifications();

    @Operation(summary = "Disable all push notifications", description = "Disables all push notification types for the user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All push notifications disabled successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> disableAllPushNotifications();

    @Operation(summary = "Reset notification preferences to defaults", description = "Resets the user's notification preferences to default settings.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notification preferences reset to defaults successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserNotificationPreferencesResponseDTO>> resetToDefaults();
}
