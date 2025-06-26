package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserPreferencesResponseDTO;
import com.kaleidoscope.backend.users.routes.UserPreferencesRoutes;
import com.kaleidoscope.backend.users.service.UserPreferencesService;
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
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;
    private final JwtUtils jwtUtils;

    @GetMapping(value = {UserPreferencesRoutes.GET_PREFERENCES, UserPreferencesRoutes.GET_PREFERENCES + "/{userId}"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> getUserPreferences(
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

    @PutMapping(UserPreferencesRoutes.UPDATE_PREFERENCES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateUserPreferences(
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

    @PatchMapping(UserPreferencesRoutes.UPDATE_THEME)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateTheme(
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

    @PatchMapping(UserPreferencesRoutes.UPDATE_LANGUAGE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateLanguage(
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

    @PatchMapping(UserPreferencesRoutes.UPDATE_PRIVACY)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updatePrivacySettings(
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

    @PatchMapping(UserPreferencesRoutes.UPDATE_VISIBILITY)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateVisibilitySettings(
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
