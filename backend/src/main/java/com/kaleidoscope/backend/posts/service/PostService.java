package com.kaleidoscope.backend.posts.service;

import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostResponseDTO;

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
}
