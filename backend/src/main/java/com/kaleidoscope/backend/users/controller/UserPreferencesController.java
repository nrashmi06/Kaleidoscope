package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserPreferencesResponseDTO;
import com.kaleidoscope.backend.users.routes.UserPreferencesRoutes;
import com.kaleidoscope.backend.users.service.UserPreferencesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Preferences", description = "APIs for managing user preferences such as theme, language, privacy, and visibility settings")
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;
    private final JwtUtils jwtUtils;

    @Operation(summary = "Get user preferences", description = "Retrieves preferences for the authenticated user or a specified user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User preferences retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping(value = {UserPreferencesRoutes.GET_PREFERENCES, UserPreferencesRoutes.GET_PREFERENCES + "/{userId}"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> getUserPreferences(
            @Parameter(description = "User ID to retrieve preferences for (optional)")
            @PathVariable(required = false) Long userId) {

        UserPreferencesResponseDTO response;
        String responsePath;

        if (userId == null) {
            // Get current user's preferences
            response = userPreferencesService.getUserPreferences();
            responsePath = UserPreferencesRoutes.GET_PREFERENCES;
        } else {
            // Service will handle all authorization checks
            response = userPreferencesService.getUserPreferencesByUserId(userId);
            responsePath = UserPreferencesRoutes.GET_PREFERENCES + "/" + userId;
        }

        return ResponseEntity.ok(
                ApiResponse.<UserPreferencesResponseDTO>builder()
                        .success(true)
                        .message("User preferences retrieved successfully")
                        .data(response)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(responsePath)
                        .build()
        );
    }

    @Operation(summary = "Update user preferences", description = "Updates the authenticated user's preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PutMapping(UserPreferencesRoutes.UPDATE_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateUserPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update user preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateUserPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateUserPreferencesRequestDTO requestDTO) {
        UserPreferencesResponseDTO response = userPreferencesService.updateUserPreferences(requestDTO);
        return ResponseEntity.ok(
                ApiResponse.<UserPreferencesResponseDTO>builder()
                        .success(true)
                        .message("User preferences updated successfully")
                        .data(response)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(UserPreferencesRoutes.UPDATE_PREFERENCES)
                        .build()
        );
    }

    @Operation(summary = "Update theme preference", description = "Updates the authenticated user's theme preference.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Theme updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserPreferencesRoutes.UPDATE_THEME)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateTheme(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update theme preference", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateThemeRequestDTO.class)))
            @Valid @RequestBody UpdateThemeRequestDTO requestDTO) {
        UserPreferencesResponseDTO response = userPreferencesService.updateTheme(requestDTO);
        return ResponseEntity.ok(
                ApiResponse.<UserPreferencesResponseDTO>builder()
                        .success(true)
                        .message("Theme updated successfully")
                        .data(response)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(UserPreferencesRoutes.UPDATE_THEME)
                        .build()
        );
    }

    @Operation(summary = "Update language preference", description = "Updates the authenticated user's language preference.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Language updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserPreferencesRoutes.UPDATE_LANGUAGE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateLanguage(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update language preference", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateLanguageRequestDTO.class)))
            @Valid @RequestBody UpdateLanguageRequestDTO requestDTO) {
        UserPreferencesResponseDTO response = userPreferencesService.updateLanguage(requestDTO);
        return ResponseEntity.ok(
                ApiResponse.<UserPreferencesResponseDTO>builder()
                        .success(true)
                        .message("Language updated successfully")
                        .data(response)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(UserPreferencesRoutes.UPDATE_LANGUAGE)
                        .build()
        );
    }

    @Operation(summary = "Update privacy settings", description = "Updates the authenticated user's privacy settings.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Privacy settings updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserPreferencesRoutes.UPDATE_PRIVACY)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updatePrivacySettings(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update privacy settings", required = true,
                    content = @Content(schema = @Schema(implementation = UpdatePrivacySettingsRequestDTO.class)))
            @Valid @RequestBody UpdatePrivacySettingsRequestDTO requestDTO) {
        UserPreferencesResponseDTO response = userPreferencesService.updatePrivacySettings(requestDTO);
        return ResponseEntity.ok(
                ApiResponse.<UserPreferencesResponseDTO>builder()
                        .success(true)
                        .message("Privacy settings updated successfully")
                        .data(response)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(UserPreferencesRoutes.UPDATE_PRIVACY)
                        .build()
        );
    }

    @Operation(summary = "Update visibility settings", description = "Updates the authenticated user's visibility settings.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Visibility settings updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PatchMapping(UserPreferencesRoutes.UPDATE_VISIBILITY)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateVisibilitySettings(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update visibility settings", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateVisibilitySettingsRequestDTO.class)))
            @Valid @RequestBody UpdateVisibilitySettingsRequestDTO requestDTO) {
        UserPreferencesResponseDTO response = userPreferencesService.updateVisibilitySettings(requestDTO);
        return ResponseEntity.ok(
                ApiResponse.<UserPreferencesResponseDTO>builder()
                        .success(true)
                        .message("Visibility settings updated successfully")
                        .data(response)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(UserPreferencesRoutes.UPDATE_VISIBILITY)
                        .build()
        );
    }
}
