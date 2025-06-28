package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.response.FollowListResponseDTO;
import com.kaleidoscope.backend.users.routes.FollowRoutes;
import com.kaleidoscope.backend.users.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Follow", description = "APIs for following and unfollowing users")
public class FollowController {

    private final FollowService followService;

    @Operation(summary = "Follow a user", description = "Allows an authenticated user to follow another user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully followed user",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @PostMapping(FollowRoutes.FOLLOW)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> followUser(
            @Parameter(description = "The ID of the user to follow", required = true)
            @RequestParam Long targetUserId) {
        followService.followUser(targetUserId);
        return ResponseEntity.ok(
                ApiResponse.<String>builder()
                        .success(true)
                        .message("Successfully followed user")
                        .data("Followed user " + targetUserId)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(FollowRoutes.FOLLOW)
                        .build()
        );
    }

    @Operation(summary = "Unfollow a user", description = "Allows an authenticated user to unfollow another user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully unfollowed user",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @DeleteMapping(FollowRoutes.FOLLOW)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> unfollowUser(
            @Parameter(description = "The ID of the user to unfollow", required = true)
            @RequestParam Long targetUserId) {
        followService.unfollowUser(targetUserId);
        return ResponseEntity.ok(
                ApiResponse.<String>builder()
                        .success(true)
                        .message("Successfully unfollowed user")
                        .data("Unfollowed user " + targetUserId)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(FollowRoutes.FOLLOW)
                        .build()
        );
    }

    @Operation(summary = "Get followers", description = "Retrieves a paginated list of followers for a given user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Followers retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping(FollowRoutes.FOLLOWERS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FollowListResponseDTO>> getFollowers(
            @Parameter(description = "The ID of the user whose followers are to be retrieved", required = true)
            @RequestParam Long userId,
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 10) Pageable pageable) {

        FollowListResponseDTO response = followService.getFollowers(userId, pageable);
        return ResponseEntity.ok(
                ApiResponse.<FollowListResponseDTO>builder()
                        .success(true)
                        .message("Followers retrieved successfully")
                        .data(response)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(FollowRoutes.FOLLOWERS)
                        .build()
        );
    }

    @Operation(summary = "Get following", description = "Retrieves a paginated list of users that a given user is following.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Following list retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping(FollowRoutes.FOLLOWING)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FollowListResponseDTO>> getFollowing(
            @Parameter(description = "The ID of the user whose following list is to be retrieved", required = true)
            @RequestParam Long userId,
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 10) Pageable pageable) {

        FollowListResponseDTO response = followService.getFollowing(userId, pageable);
        return ResponseEntity.ok(
                ApiResponse.<FollowListResponseDTO>builder()
                        .success(true)
                        .message("Following list retrieved successfully")
                        .data(response)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(FollowRoutes.FOLLOWING)
                        .build()
        );
    }
}