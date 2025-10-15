package com.kaleidoscope.backend.users.service;

import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.dto.response.FollowListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import org.springframework.data.domain.Pageable;

public interface FollowService {
    void followUser(Long targetUserId);
    void unfollowUser(Long targetUserId);
    FollowListResponseDTO getFollowers(Long userId, Pageable pageable);
    FollowListResponseDTO getFollowing(Long userId, Pageable pageable);
    PaginatedResponse<UserDetailsSummaryResponseDTO> getFollowSuggestions(Long userId, Pageable pageable);
}