package com.kaleidoscope.backend.posts.service;

import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCreationResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostDetailResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import org.springframework.data.domain.Pageable;

public interface PostService {
    PostCreationResponseDTO createPost(PostCreateRequestDTO postCreateRequestDTO);
    PostCreationResponseDTO updatePost(Long postId, PostUpdateRequestDTO dto);
    void softDeletePost(Long postId);
    void hardDeletePost(Long postId);
    PostDetailResponseDTO getPostById(Long postId);
    PaginatedResponse<PostSummaryResponseDTO> filterPosts(Pageable pageable,
                                                           Long userId,
                                                           Long categoryId,
                                                           PostStatus status,
                                                           PostVisibility visibility,
                                                           String query,
                                                           String hashtag,
                                                           Long locationId,
                                                           Long nearbyLocationId,
                                                           Double radiusKm);
}