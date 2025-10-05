package com.kaleidoscope.backend.users.controller.api;

import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserNotificationPreferencesResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
            @ApiResponse(responseCode = "200", description = "Notification preferences retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    ResponseEntity<AppResponse<UserNotificationPreferencesResponseDTO>> getNotificationPreferences(
            @Parameter(description = "User ID for which to retrieve preferences (optional)")
            @PathVariable(required = false) Long userId);

    @Operation(summary = "Get all notification preferences (Admin)", description = "Retrieves notification preferences for all users. Requires admin privileges.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All notification preferences retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    ResponseEntity<AppResponse<Page<UserNotificationPreferencesResponseDTO>>> getAllNotificationPreferences(
            @Parameter(description = "Pagination information")
            Pageable pageable);

    @Operation(summary = "Update notification preferences", description = "Replaces the current user's notification preferences with the provided values.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<AppResponse<UserNotificationPreferencesResponseDTO>> updateNotificationPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update notification preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateNotificationPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateNotificationPreferencesRequestDTO requestDTO);

    @Operation(summary = "Partially update notification preferences", description = "Updates only the provided fields of the current user's notification preferences.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<AppResponse<UserNotificationPreferencesResponseDTO>> partialUpdateNotificationPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body for partial update", required = true,
                    content = @Content(schema = @Schema(implementation = PartialUpdateNotificationPreferencesRequestDTO.class)))
            @Valid @RequestBody PartialUpdateNotificationPreferencesRequestDTO requestDTO);

    @Operation(summary = "Reset notification preferences to defaults", description = "Resets the user's notification preferences to default settings.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification preferences reset to defaults successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<AppResponse<UserNotificationPreferencesResponseDTO>> resetToDefaults();
}
