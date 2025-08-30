package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.model.Follow;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

@Component
public class FollowMapper {

    public UserDetailsSummaryResponseDTO mapToUserSummary(User user) {
        return UserDetailsSummaryResponseDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .accountStatus(user.getAccountStatus().name())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build();
    }

    public UserDetailsSummaryResponseDTO mapFollowerToUserSummary(Follow follow) {
        return mapToUserSummary(follow.getFollower());
    }

    public UserDetailsSummaryResponseDTO mapFollowingToUserSummary(Follow follow) {
        return mapToUserSummary(follow.getFollowing());
    }
}