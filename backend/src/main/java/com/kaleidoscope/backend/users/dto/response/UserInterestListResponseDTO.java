package com.kaleidoscope.backend.users.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInterestListResponseDTO {

    private List<UserInterestResponseDTO> interests;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}
