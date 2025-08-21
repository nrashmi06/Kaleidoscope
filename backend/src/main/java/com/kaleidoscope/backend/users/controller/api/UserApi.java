package com.kaleidoscope.backend.users.controller.api;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileStatusRequestDTO;
import com.kaleidoscope.backend.users.dto.response.UpdateUserProfileResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "User", description = "APIs for managing user profiles and accounts")
public interface UserApi {

    @Operation(summary = "Update user profile", description = "Updates the authenticated user's profile including profile picture, cover photo, and other details.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    ResponseEntity<ApiResponse<UpdateUserProfileResponseDTO>> updateUserProfile(
            @Parameter(description = "Profile picture file", required = false)
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture,
            @Parameter(description = "Cover photo file", required = false)
            @RequestPart(value = "coverPhoto", required = false) MultipartFile coverPhoto,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "User profile data to update", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateUserProfileRequestDTO.class)))
            @RequestPart("userData") UpdateUserProfileRequestDTO userProfileData) throws Exception;

    @Operation(summary = "Get users by profile status", description = "Retrieves a paginated list of users filtered by profile status or search query. Requires admin role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Users retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    ResponseEntity<ApiResponse<Page<UserDetailsSummaryResponseDTO>>> getAllUsers(
            @Parameter(description = "Filter by profile status", required = false)
            @RequestParam(required = false) String status,
            @Parameter(description = "Search query for username or email", required = false)
            @RequestParam(required = false) String search,
            @Parameter(description = "Pagination information")
            Pageable pageable);

    @Operation(summary = "Update user profile status", description = "Updates the profile status of a user. Requires admin role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile status updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<ApiResponse<String>> updateUserProfileStatus(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request to update user profile status", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateUserProfileStatusRequestDTO.class)))
            @RequestBody UpdateUserProfileStatusRequestDTO updateUserProfileStatusRequestDTO);
}
