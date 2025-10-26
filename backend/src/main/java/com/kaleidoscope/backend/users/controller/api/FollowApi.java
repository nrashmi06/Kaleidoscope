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

    @Operation(summary = "Follow a user", description = "Allows an authenticated user to follow another user. For public profiles, follows immediately. For private profiles (FRIENDS_ONLY), creates a follow request that requires approval.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully followed user or sent follow request",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "409", description = "Already following or request already sent")
    })
    ResponseEntity<AppResponse<String>> followUser(
            @Parameter(description = "The ID of the user to follow", required = true)
            @RequestParam Long targetUserId);

    @Operation(summary = "Unfollow a user", description = "Allows an authenticated user to unfollow another user or cancel a pending follow request.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully unfollowed user or cancelled request",
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

    @Operation(summary = "Get pending follow requests", description = "Retrieves a paginated list of pending follow requests received by the authenticated user, sorted by creation time (newest first).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pending requests retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<AppResponse<PaginatedResponse<UserDetailsSummaryResponseDTO>>> getPendingFollowRequests(
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable);

    @Operation(summary = "Approve a follow request", description = "Approves a follow request from another user, creating a follow relationship.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Follow request approved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Follow request not found")
    })
    ResponseEntity<AppResponse<String>> approveFollowRequest(
            @Parameter(description = "The ID of the user who sent the follow request", required = true)
            @RequestParam Long requesterUserId);

    @Operation(summary = "Reject a follow request", description = "Rejects a follow request from another user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Follow request rejected successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Follow request not found")
    })
    ResponseEntity<AppResponse<String>> rejectFollowRequest(
            @Parameter(description = "The ID of the user who sent the follow request", required = true)
            @RequestParam Long requesterUserId);
}
