package com.kaleidoscope.backend.users.dto.response;

import java.util.List;

public record BlockedUsersListResponseDTO(List<UserDetailsSummaryResponseDTO> blockedUsers, int currentPage, int totalPages, long totalElements) {}
