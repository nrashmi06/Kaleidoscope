package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.controller.api.FollowApi;
import com.kaleidoscope.backend.users.dto.response.FollowListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.routes.FollowRoutes;
import com.kaleidoscope.backend.users.service.FollowService;
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
public class FollowController implements FollowApi {

    private final FollowService followService;

    @Override
    @PostMapping(FollowRoutes.FOLLOW)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<String>> followUser(@RequestParam Long targetUserId) {
        followService.followUser(targetUserId);
        return ResponseEntity.ok(
                AppResponse.<String>builder()
                        .success(true)
                        .message("Successfully followed user")
                        .data("Followed user " + targetUserId)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(FollowRoutes.FOLLOW)
                        .build()
        );
    }

    @Override
    @DeleteMapping(FollowRoutes.FOLLOW)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<String>> unfollowUser(@RequestParam Long targetUserId) {
        followService.unfollowUser(targetUserId);
        return ResponseEntity.ok(
                AppResponse.<String>builder()
                        .success(true)
                        .message("Successfully unfollowed user")
                        .data("Unfollowed user " + targetUserId)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(FollowRoutes.FOLLOW)
                        .build()
        );
    }

    @Override
    @GetMapping(FollowRoutes.FOLLOWERS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<FollowListResponseDTO>> getFollowers(
            @RequestParam Long userId,
            @PageableDefault(size = 10) Pageable pageable) {

        FollowListResponseDTO response = followService.getFollowers(userId, pageable);
        return ResponseEntity.ok(
                AppResponse.<FollowListResponseDTO>builder()
                        .success(true)
                        .message("Followers retrieved successfully")
                        .data(response)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(FollowRoutes.FOLLOWERS)
                        .build()
        );
    }

    @Override
    @GetMapping(FollowRoutes.FOLLOWING)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<FollowListResponseDTO>> getFollowing(
            @RequestParam Long userId,
            @PageableDefault(size = 10) Pageable pageable) {

        FollowListResponseDTO response = followService.getFollowing(userId, pageable);
        return ResponseEntity.ok(
                AppResponse.<FollowListResponseDTO>builder()
                        .success(true)
                        .message("Following list retrieved successfully")
                        .data(response)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(FollowRoutes.FOLLOWING)
                        .build()
        );
    }

    @Override
    @GetMapping(FollowRoutes.BASE + "/suggestions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<PaginatedResponse<UserDetailsSummaryResponseDTO>>> getFollowSuggestions(
            @RequestParam(required = false) Long userId,
            @PageableDefault(size = 10) Pageable pageable) {

        PaginatedResponse<UserDetailsSummaryResponseDTO> response = followService.getFollowSuggestions(userId, pageable);
        return ResponseEntity.ok(
                AppResponse.success(response, "Follow suggestions retrieved successfully", FollowRoutes.BASE + "/suggestions")
        );
    }
}