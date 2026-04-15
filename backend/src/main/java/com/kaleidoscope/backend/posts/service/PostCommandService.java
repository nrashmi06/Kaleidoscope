package com.kaleidoscope.backend.posts.service;

import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCreationResponseDTO;

public interface PostCommandService {
    PostCreationResponseDTO createPost(PostCreateRequestDTO postCreateRequestDTO);

    PostCreationResponseDTO updatePost(Long postId, PostUpdateRequestDTO requestDTO);

    void softDeletePost(Long postId);

    void hardDeletePost(Long postId);
}