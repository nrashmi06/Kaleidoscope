package com.kaleidoscope.backend.posts.controller.api;

import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostResponseDTO;
import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.posts.routes.PostsRoutes;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@Tag(name = "Post", description = "APIs for managing posts")
public interface PostApi {

    @Operation(summary = "Generate upload signatures", description = "Generates presigned URLs for uploading post media.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Signatures generated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping(PostsRoutes.GENERATE_UPLOAD_SIGNATURES)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<UploadSignatureResponseDTO>> generateUploadSignatures(
            @Parameter(description = "Request body for generating upload signatures")
            @Valid @RequestBody GenerateUploadSignatureRequestDTO requestDTO);

    @Operation(summary = "Create a new post", description = "Creates a new post after media is uploaded.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Post created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Post already exists")
    })
    @PostMapping(PostsRoutes.CREATE_POST)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<PostResponseDTO>> createPost(
            @Parameter(description = "Post creation request body")
            @Valid @RequestBody PostCreateRequestDTO postCreateRequestDTO);

    @Operation(summary = "Update an existing post", description = "Updates an existing post, including title, body, media, categories, location, and type. Handles media add/remove/reorder.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Post updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Post not found")
    })
    @org.springframework.web.bind.annotation.PutMapping(PostsRoutes.UPDATE_POST)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<PostResponseDTO>> updatePost(
            @io.swagger.v3.oas.annotations.Parameter(description = "ID of the post to update")
            @org.springframework.web.bind.annotation.PathVariable Long postId,
            @io.swagger.v3.oas.annotations.Parameter(description = "Post update request body")
            @Valid @org.springframework.web.bind.annotation.RequestBody com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO requestDTO);
}
