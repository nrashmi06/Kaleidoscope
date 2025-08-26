package com.kaleidoscope.backend.posts.service;

import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostResponseDTO;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostType;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service for managing posts
 */
public interface PostService {
    /**
     * Create a new post
     * @param postCreateRequestDTO the post data
     * @return the created post
     */
    PostResponseDTO createPost(PostCreateRequestDTO postCreateRequestDTO);

    /**
     * Update an existing post
     * @param postId the id of the post to update
     * @param dto the new data for the post
     * @return the updated post
     */
    PostResponseDTO updatePost(Long postId, PostUpdateRequestDTO dto);

    /**
     * Soft delete a post by id. Only owner or admin can delete.
     */
    void softDeletePost(Long postId);

    /**
     * Hard delete a post by id. Admin only.
     */
    void hardDeletePost(Long postId);

    /**
     * Get a single post with visibility checks.
     */
    PostResponseDTO getPostById(Long postId);

    /**
     * Filter posts with role-aware visibility rules and pagination.
     */
    PaginatedResponse<PostResponseDTO> filterPosts(Pageable pageable,
                                                   Long userId,
                                                   Long categoryId,
                                                   PostType type,
                                                   PostStatus status,
                                                   PostVisibility visibility,
                                                   String query);
}
