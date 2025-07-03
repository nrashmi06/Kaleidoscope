package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.shared.service.CategoryService;
import com.kaleidoscope.backend.users.dto.response.UserInterestListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserInterestResponseDTO;
import com.kaleidoscope.backend.users.model.UserInterest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserInterestMapper {

    private final CategoryService categoryService;

    public UserInterestResponseDTO toResponseDTO(UserInterest userInterest) {
        return UserInterestResponseDTO.builder()
                .interestId(userInterest.getInterestId())
                .userId(userInterest.getUser().getUserId())
                .category(categoryService.getCategoryWithChildren(userInterest.getCategory().getCategoryId()))
                .createdAt(userInterest.getCreatedAt())
                .build();
    }

    public UserInterestListResponseDTO toListResponseDTO(Page<UserInterest> userInterests, Pageable pageable) {
        List<UserInterestResponseDTO> interestDTOs = userInterests.getContent().stream()
                .map(this::toResponseDTO)
                .toList();

        return UserInterestListResponseDTO.builder()
                .interests(interestDTOs)
                .currentPage(pageable.getPageNumber())
                .totalPages(userInterests.getTotalPages())
                .totalElements(userInterests.getTotalElements())
                .build();
    }

    /**
     * Build paginated response with filtered interests
     * This eliminates the duplication between getUserInterests and getUserInterestsByUserId
     */
    public UserInterestListResponseDTO buildPaginatedResponse(
            List<UserInterest> filteredInterests,
            Page<UserInterest> originalPage,
            Pageable pageable) {

        List<UserInterestResponseDTO> interestDTOs = filteredInterests.stream()
                .map(this::toResponseDTO)
                .toList();

        return UserInterestListResponseDTO.builder()
                .interests(interestDTOs)
                .currentPage(pageable.getPageNumber())
                .totalPages(originalPage.getTotalPages())
                .totalElements(filteredInterests.size())
                .build();
    }
}
