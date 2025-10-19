package com.kaleidoscope.backend.posts.controller.api;

import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCreationResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostDetailResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.posts.routes.PostsRoutes;
import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Post", description = "APIs for managing posts")
public interface PostApi {

    @Operation(summary = "Generate upload signatures", description = "Generates presigned URLs for uploading post media.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signatures generated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping(PostsRoutes.GENERATE_UPLOAD_SIGNATURES)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<UploadSignatureResponseDTO>> generateUploadSignatures(
            @Parameter(description = "Request body for generating upload signatures")
            @Valid @RequestBody GenerateUploadSignatureRequestDTO requestDTO);

    @Operation(summary = "Create a new post", description = "Creates a new post after media is uploaded.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Post created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "409", description = "Post already exists")
    })
    @PostMapping(PostsRoutes.CREATE_POST)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<PostCreationResponseDTO>> createPost(
            @Parameter(description = "Post creation request body")
            @Valid @RequestBody PostCreateRequestDTO postCreateRequestDTO);

    @Operation(summary = "Update an existing post", description = "Updates an existing post, including title, body, media, categories, location, and type. Handles media add/remove/reorder.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Post updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Post not found")
    })
    @PutMapping(PostsRoutes.UPDATE_POST)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<PostCreationResponseDTO>> updatePost(
            @Parameter(description = "ID of the post to update")
            @PathVariable Long postId,
            @Parameter(description = "Post update request body")
            @Valid @RequestBody com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO requestDTO);

    @Operation(summary = "Soft delete a post", description = "Soft deletes a post. Only the owner or an admin can perform this action.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Post deleted successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Post not found")
    })
    @DeleteMapping(PostsRoutes.DELETE_POST)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<Object>> deletePost(@PathVariable Long postId);

    @Operation(summary = "Hard delete a post (admin)", description = "Permanently deletes a post and all associated media. Admin only.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Post hard deleted successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Post not found")
    })
    @DeleteMapping(PostsRoutes.HARD_DELETE_POST)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<Object>> hardDeletePost(@PathVariable Long postId);

    @Operation(summary = "Get post by ID", description = "Returns a post by id respecting visibility and role rules.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Post retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Post not found")
    })
    @GetMapping(PostsRoutes.GET_POST_BY_ID)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<PostDetailResponseDTO>> getPostById(@PathVariable Long postId);

    @Operation(summary = "Filter posts", description = "Returns paginated posts. Admins see all; users see PUBLISHED posts that are PUBLIC, their own, or from followings.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Posts retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping(PostsRoutes.FILTER_POSTS)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<PaginatedResponse<PostSummaryResponseDTO>>> filterPosts(
            @Parameter(hidden = true) Pageable pageable,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) PostStatus status,
            @RequestParam(required = false) PostVisibility visibility,
            @RequestParam(required = false) String q
    );

    @Operation(summary = "Get post suggestions",
               description = "Returns personalized post suggestions based on user's interests, follows, and post popularity. Uses Elasticsearch function_score query for intelligent ranking.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Post suggestions retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping(PostsRoutes.SUGGESTIONS)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<AppResponse<PaginatedResponse<PostSummaryResponseDTO>>> getPostSuggestions(
            @Parameter(hidden = true) Pageable pageable
    );
}
