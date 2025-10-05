package com.kaleidoscope.backend.users.dto.response;

import java.util.List;

public record FollowListResponseDTO(List<UserDetailsSummaryResponseDTO> users, int currentPage, int totalPages, long totalElements) {}
