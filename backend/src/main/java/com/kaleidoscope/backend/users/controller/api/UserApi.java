package com.kaleidoscope.backend.users.controller.api;

import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileStatusRequestDTO;
import com.kaleidoscope.backend.users.dto.response.UpdateUserProfileResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserProfileResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "User", description = "APIs for managing user profiles and accounts")
public interface UserApi {

    @Operation(summary = "Update user profile", description = "Updates the authenticated user's profile including profile picture, cover photo, and other details.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "500", description = "Server error")
    })
    ResponseEntity<AppResponse<UpdateUserProfileResponseDTO>> updateUserProfile(
            @Parameter(description = "Profile picture file", required = false)
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture,
            @Parameter(description = "Cover photo file", required = false)
            @RequestPart(value = "coverPhoto", required = false) MultipartFile coverPhoto,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "User profile data to update", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateUserProfileRequestDTO.class)))
            @RequestPart("userData") UpdateUserProfileRequestDTO userProfileData) throws Exception;

    @Operation(summary = "Get users by profile status", description = "Retrieves a paginated list of users filtered by profile status or search query. Requires admin role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    ResponseEntity<AppResponse<Page<UserDetailsSummaryResponseDTO>>> getAllUsers(
            @Parameter(description = "Filter by profile status", required = false)
            @RequestParam(required = false) String status,
            @Parameter(description = "Search query for username or email", required = false)
            @RequestParam(required = false) String search,
            @Parameter(description = "Pagination information")
            Pageable pageable);

    @Operation(summary = "Update user profile status", description = "Updates the profile status of a user. Requires admin role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile status updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<AppResponse<String>> updateUserProfileStatus(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update user profile status", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateUserProfileStatusRequestDTO.class)))
            @RequestBody UpdateUserProfileStatusRequestDTO updateUserProfileStatusRequestDTO);

    @Operation(summary = "Get user profile by ID", description = "Retrieves a user's public or private profile, including follow status and posts, based on the viewer's relationship.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<AppResponse<UserProfileResponseDTO>> getUserProfile(
            @Parameter(description = "The ID of the user profile to retrieve", required = true)
            @PathVariable Long userId,
            @Parameter(hidden = true)
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable);
}
