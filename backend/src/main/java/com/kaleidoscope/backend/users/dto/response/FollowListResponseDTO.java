package com.kaleidoscope.backend.users.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FollowListResponseDTO {
    private List<UserDetailsSummaryResponseDTO> users;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}