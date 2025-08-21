package com.kaleidoscope.backend.users.controller.api;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.*;
import com.kaleidoscope.backend.users.dto.response.UserPreferencesResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

@Tag(name = "User Preferences", description = "APIs for managing user preferences such as theme, language, privacy, and visibility settings")
public interface UserPreferencesApi {

    @Operation(summary = "Get user preferences", description = "Retrieves preferences for the authenticated user or a specified user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User preferences retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> getUserPreferences(
            @Parameter(description = "User ID to retrieve preferences for (optional)")
            @PathVariable(required = false) Long userId);

    @Operation(summary = "Update user preferences", description = "Updates the authenticated user's preferences.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User preferences updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateUserPreferences(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update user preferences", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateUserPreferencesRequestDTO.class)))
            @Valid @RequestBody UpdateUserPreferencesRequestDTO requestDTO);

    @Operation(summary = "Update theme preference", description = "Updates the authenticated user's theme preference.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Theme updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateTheme(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update theme preference", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateThemeRequestDTO.class)))
            @Valid @RequestBody UpdateThemeRequestDTO requestDTO);

    @Operation(summary = "Update language preference", description = "Updates the authenticated user's language preference.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Language updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateLanguage(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update language preference", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateLanguageRequestDTO.class)))
            @Valid @RequestBody UpdateLanguageRequestDTO requestDTO);

    @Operation(summary = "Update privacy settings", description = "Updates the authenticated user's privacy settings.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Privacy settings updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updatePrivacySettings(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update privacy settings", required = true,
                    content = @Content(schema = @Schema(implementation = UpdatePrivacySettingsRequestDTO.class)))
            @Valid @RequestBody UpdatePrivacySettingsRequestDTO requestDTO);

    @Operation(summary = "Update visibility settings", description = "Updates the authenticated user's visibility settings.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Visibility settings updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<UserPreferencesResponseDTO>> updateVisibilitySettings(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to update visibility settings", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateVisibilitySettingsRequestDTO.class)))
            @Valid @RequestBody UpdateVisibilitySettingsRequestDTO requestDTO);
}
