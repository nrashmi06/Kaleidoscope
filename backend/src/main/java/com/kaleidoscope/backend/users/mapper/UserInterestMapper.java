package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.shared.service.CategoryService;
import com.kaleidoscope.backend.users.dto.response.UserInterestResponseDTO;
import com.kaleidoscope.backend.users.model.UserInterest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserInterestMapper {

    private final CategoryService categoryService;

    public UserInterestResponseDTO toResponseDTO(UserInterest userInterest) {
        return new UserInterestResponseDTO(
                userInterest.getInterestId(),
                userInterest.getUser().getUserId(),
                categoryService.getCategoryWithChildren(userInterest.getCategory().getCategoryId()),
                userInterest.getCreatedAt()
        );
    }

    public Page<UserInterestResponseDTO> toResponseDTOPage(Page<UserInterest> userInterests) {
        return userInterests.map(this::toResponseDTO);
    }
}
