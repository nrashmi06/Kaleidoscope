package com.kaleidoscope.backend.users.dto.response;

import com.kaleidoscope.backend.shared.dto.response.CategoryResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInterestResponseDTO {

    private Long interestId;
    private Long userId;
    private CategoryResponseDTO category;
    private LocalDateTime createdAt;
}
