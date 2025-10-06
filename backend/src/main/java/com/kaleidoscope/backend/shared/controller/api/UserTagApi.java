package com.kaleidoscope.backend.shared.controller.api;

import com.kaleidoscope.backend.shared.dto.request.CreateUserTagRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "User Tagging", description = "User tagging management APIs")
public interface UserTagApi {

    @Operation(summary = "Get taggable users", description = "Search for users that can be tagged by the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<AppResponse<PaginatedResponse<UserDetailsSummaryResponseDTO>>> getTaggableUsers(
            @Parameter(description = "Search query for username/email") @RequestParam(required = false) String q,
            Pageable pageable
    );

    @Operation(summary = "Create user tag", description = "Tag a user in specific content")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Tag created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "409", description = "User already tagged")
    })
    ResponseEntity<AppResponse<UserTagResponseDTO>> createUserTag(
            @Valid @RequestBody CreateUserTagRequestDTO requestDTO
    );

    @Operation(summary = "Get tags for content", description = "Get all user tags for specific content")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tags retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<AppResponse<PaginatedResponse<UserTagResponseDTO>>> getTagsForContent(
            @Parameter(description = "Content type") @PathVariable ContentType contentType,
            @Parameter(description = "Content ID") @PathVariable Long contentId,
            Pageable pageable
    );

    @Operation(summary = "Get content user is tagged in", description = "Get all content where a specific user is tagged")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tagged content retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<AppResponse<PaginatedResponse<UserTagResponseDTO>>> getContentUserIsTaggedIn(
            @Parameter(description = "User ID") @PathVariable Long userId,
            Pageable pageable
    );

    @Operation(summary = "Delete tag", description = "Delete a user tag (only by tagged user, tagger, or admin)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tag deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Tag not found")
    })
    ResponseEntity<AppResponse<Object>> deleteTag(
            @Parameter(description = "Tag ID") @PathVariable Long tagId
    );
}
