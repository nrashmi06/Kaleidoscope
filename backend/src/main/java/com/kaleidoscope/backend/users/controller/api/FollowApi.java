package com.kaleidoscope.backend.users.controller.api;

import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.dto.response.FollowListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "Follow", description = "APIs for following and unfollowing users")
public interface FollowApi {

    @Operation(summary = "Follow a user", description = "Allows an authenticated user to follow another user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully followed user",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<AppResponse<String>> followUser(
            @Parameter(description = "The ID of the user to follow", required = true)
            @RequestParam Long targetUserId);

    @Operation(summary = "Unfollow a user", description = "Allows an authenticated user to unfollow another user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully unfollowed user",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<AppResponse<String>> unfollowUser(
            @Parameter(description = "The ID of the user to unfollow", required = true)
            @RequestParam Long targetUserId);

    @Operation(summary = "Get followers", description = "Retrieves a paginated list of followers for a given user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Followers retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<AppResponse<FollowListResponseDTO>> getFollowers(
            @Parameter(description = "The ID of the user whose followers are to be retrieved", required = true)
            @RequestParam Long userId,
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 10) Pageable pageable);

    @Operation(summary = "Get following", description = "Retrieves a paginated list of users that a given user is following.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Following list retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<AppResponse<FollowListResponseDTO>> getFollowing(
            @Parameter(description = "The ID of the user whose following list is to be retrieved", required = true)
            @RequestParam Long userId,
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 10) Pageable pageable);

    @Operation(summary = "Get follow suggestions", description = "Retrieves a paginated list of suggested users to follow, ranked by social connections, shared interests, and similar designations.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Suggestions retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    ResponseEntity<AppResponse<PaginatedResponse<UserDetailsSummaryResponseDTO>>> getFollowSuggestions(
            @Parameter(description = "User ID to get suggestions for (admin only). If null, returns suggestions for the authenticated user.")
            @RequestParam(required = false) Long userId,
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 10) Pageable pageable);
}
