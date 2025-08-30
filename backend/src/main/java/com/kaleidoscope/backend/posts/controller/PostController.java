package com.kaleidoscope.backend.posts.controller;

import com.kaleidoscope.backend.posts.controller.api.PostApi;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCreationResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostDetailResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.posts.routes.PostsRoutes;
import com.kaleidoscope.backend.posts.service.PostService;
import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
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
public class PostController implements PostApi {
    private final PostService postService;
    private final ImageStorageService imageStorageService;

    @Override
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
    public ResponseEntity<ApiResponse<PostCreationResponseDTO>> createPost(
            @Valid @RequestBody PostCreateRequestDTO postCreateRequestDTO) {
        log.info("Creating post with title: {}", postCreateRequestDTO.getTitle());
        PostCreationResponseDTO createdPost = postService.createPost(postCreateRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<PostCreationResponseDTO>builder()
                        .success(true)
                        .message("Post created successfully")
                        .data(createdPost)
                        .build());
    }

    @PutMapping(PostsRoutes.UPDATE_POST)
    @PreAuthorize("isAuthenticated()")
    @Override
    public ResponseEntity<ApiResponse<PostCreationResponseDTO>> updatePost(@PathVariable Long postId, @Valid @RequestBody PostUpdateRequestDTO requestDTO) {
        PostCreationResponseDTO updatedPost = postService.updatePost(postId, requestDTO);
        return ResponseEntity.ok(ApiResponse.<PostCreationResponseDTO>builder()
                .success(true)
                .message("Post updated successfully.")
                .data(updatedPost)
                .build());
    }
    @DeleteMapping(PostsRoutes.DELETE_POST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> deletePost(@PathVariable Long postId) {
        postService.softDeletePost(postId);
        return ResponseEntity.ok(ApiResponse.<Object>builder()
                .success(true)
                .message("Post deleted successfully.")
                .data(null)
                .build());
    }

    @DeleteMapping(PostsRoutes.HARD_DELETE_POST)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> hardDeletePost(@PathVariable Long postId) {
        postService.hardDeletePost(postId);
        return ResponseEntity.ok(ApiResponse.<Object>builder()
                .success(true)
                .message("Post hard deleted successfully.")
                .data(null)
                .build());
    }

    @GetMapping(PostsRoutes.GET_POST_BY_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostDetailResponseDTO>> getPostById(@PathVariable Long postId) {
        PostDetailResponseDTO post = postService.getPostById(postId);
        return ResponseEntity.ok(ApiResponse.<PostDetailResponseDTO>builder()
                .success(true)
                .message("Post retrieved successfully.")
                .data(post)
                .build());
    }

    @GetMapping(PostsRoutes.FILTER_POSTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginatedResponse<PostSummaryResponseDTO>>> filterPosts(
            Pageable pageable,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) PostStatus status,
            @RequestParam(required = false) PostVisibility visibility,
            @RequestParam(required = false) String q
    ) {
        PaginatedResponse<PostSummaryResponseDTO> response = postService.filterPosts(pageable, userId, categoryId, status, visibility, q);
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<PostSummaryResponseDTO>>builder()
                .success(true)
                .message("Posts retrieved successfully.")
                .data(response)
                .build());
    }
}