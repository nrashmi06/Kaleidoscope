package com.kaleidoscope.backend.posts.controller;

import com.kaleidoscope.backend.posts.controller.api.PostApi;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostResponseDTO;
import com.kaleidoscope.backend.posts.routes.PostsRoutes;
import com.kaleidoscope.backend.posts.service.PostService;
import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class PostController implements PostApi {
    private final PostService postService;
    private final ImageStorageService imageStorageService;

    /**
     * PHASE 1: Endpoint to generate upload signatures for the client.
     */
    @PostMapping(PostsRoutes.GENERATE_UPLOAD_SIGNATURES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UploadSignatureResponseDTO>> generateUploadSignatures(
            @Valid @RequestBody GenerateUploadSignatureRequestDTO requestDTO) {
        log.info("Generating upload signatures for {} files", requestDTO.getFileNames().size());
        UploadSignatureResponseDTO response = imageStorageService.generatePostUploadSignatures(requestDTO);
        return ResponseEntity.ok(ApiResponse.<UploadSignatureResponseDTO>builder()
                .success(true)
                .message("Signatures generated successfully.")
                .data(response)
                .build());
    }


    @PostMapping(PostsRoutes.CREATE_POST)
    @PreAuthorize("isAuthenticated()")
    @Override
    public ResponseEntity<ApiResponse<PostResponseDTO>> createPost(
            @Valid @RequestBody PostCreateRequestDTO postCreateRequestDTO) {
        log.info("Creating post with title: {}", postCreateRequestDTO.getTitle());
        PostResponseDTO createdPost = postService.createPost(postCreateRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<PostResponseDTO>builder()
                        .success(true)
                        .message("Post created successfully")
                        .data(createdPost)
                        .build());
    }

    @Override
    public ResponseEntity<ApiResponse<PostResponseDTO>> updatePost(Long postId, @Valid @RequestBody PostUpdateRequestDTO requestDTO) {
        PostResponseDTO updatedPost = postService.updatePost(postId, requestDTO);
        return ResponseEntity.ok(ApiResponse.<PostResponseDTO>builder()
                .success(true)
                .message("Post updated successfully.")
                .data(updatedPost)
                .build());
    }
}