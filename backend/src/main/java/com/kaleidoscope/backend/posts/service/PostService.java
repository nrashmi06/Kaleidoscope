package com.kaleidoscope.backend.posts.service;

import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
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
}

