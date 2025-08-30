package com.kaleidoscope.backend.shared.controller;

import com.kaleidoscope.backend.shared.controller.api.UserTagApi;
import com.kaleidoscope.backend.shared.dto.request.CreateUserTagRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.routes.UserTagRoutes;
import com.kaleidoscope.backend.shared.service.UserTagService;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Slf4j
public class UserTagController implements UserTagApi {

    private final UserTagService userTagService;

    @Override
    @GetMapping(UserTagRoutes.TAGGABLE_USERS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginatedResponse<UserDetailsSummaryResponseDTO>>> getTaggableUsers(
            @RequestParam(required = false) String q,
            Pageable pageable) {
        log.info("Getting taggable users with query: {}", q);
        PaginatedResponse<UserDetailsSummaryResponseDTO> response = userTagService.findTaggableUsers(q, pageable);
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<UserDetailsSummaryResponseDTO>>builder()
                .success(true)
                .message("Taggable users retrieved successfully")
                .data(response)
                .build());
    }

    @Override
    @PostMapping(UserTagRoutes.CREATE_TAG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserTagResponseDTO>> createUserTag(
            @Valid @RequestBody CreateUserTagRequestDTO requestDTO) {
        log.info("Creating user tag for user {} on content {}:{}", 
                requestDTO.getTaggedUserId(), requestDTO.getContentType(), requestDTO.getContentId());
        UserTagResponseDTO response = userTagService.createUserTag(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<UserTagResponseDTO>builder()
                        .success(true)
                        .message("User tag created successfully")
                        .data(response)
                        .build());
    }

    @Override
    @GetMapping(UserTagRoutes.CONTENT_TAGS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginatedResponse<UserTagResponseDTO>>> getTagsForContent(
            @PathVariable ContentType contentType,
            @PathVariable Long contentId,
            Pageable pageable) {
        log.info("Getting tags for content {}:{}", contentType, contentId);
        PaginatedResponse<UserTagResponseDTO> response = userTagService.getTagsForContent(contentType, contentId, pageable);
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<UserTagResponseDTO>>builder()
                .success(true)
                .message("Content tags retrieved successfully")
                .data(response)
                .build());
    }

    @Override
    @GetMapping(UserTagRoutes.USER_TAGGED_CONTENT)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginatedResponse<UserTagResponseDTO>>> getContentUserIsTaggedIn(
            @PathVariable Long userId,
            Pageable pageable) {
        log.info("Getting content where user {} is tagged", userId);
        PaginatedResponse<UserTagResponseDTO> response = userTagService.getContentUserIsTaggedIn(userId, pageable);
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<UserTagResponseDTO>>builder()
                .success(true)
                .message("Tagged content retrieved successfully")
                .data(response)
                .build());
    }

    @Override
    @DeleteMapping(UserTagRoutes.DELETE_TAG)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> deleteTag(@PathVariable Long tagId) {
        log.info("Deleting tag with ID: {}", tagId);
        userTagService.deleteTag(tagId);
        return ResponseEntity.ok(ApiResponse.<Object>builder()
                .success(true)
                .message("Tag deleted successfully")
                .data(null)
                .build());
    }
}
