package com.kaleidoscope.backend.posts.service;

import com.kaleidoscope.backend.posts.dto.response.PostSaveResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import org.springframework.data.domain.Pageable;

public interface PostSaveService {
    PostSaveResponseDTO saveOrUnsavePost(Long postId, boolean unsave);
    PostSaveResponseDTO getPostSaveStatus(Long postId);
    PaginatedResponse<PostSummaryResponseDTO> getSavedPosts(Pageable pageable);
}
