package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.users.controller.api.UserInterestApi;
import com.kaleidoscope.backend.users.dto.request.AddUserInterestRequestDTO;
import com.kaleidoscope.backend.users.dto.request.BulkUserInterestRequestDTO;
import com.kaleidoscope.backend.users.dto.response.CategoryAnalyticsResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserInterestResponseDTO;
import com.kaleidoscope.backend.users.routes.UserInterestRoutes;
import com.kaleidoscope.backend.users.service.UserInterestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@Slf4j
@RequestMapping
@RequiredArgsConstructor
public class UserInterestController implements UserInterestApi {

    private final UserInterestService userInterestService;

    @Override
    @PostMapping(UserInterestRoutes.ADD_USER_INTEREST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<Object>> addUserInterest(@Valid @RequestBody AddUserInterestRequestDTO request) {

        userInterestService.addUserInterest(request.categoryId());

        AppResponse<Object> response = AppResponse.success(
                null,
                "Interest added successfully",
                UserInterestRoutes.ADD_USER_INTEREST
        );
        return ResponseEntity.ok(response);
    }

    @Override
    @DeleteMapping(UserInterestRoutes.REMOVE_USER_INTEREST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<Object>> removeUserInterest(@PathVariable Long categoryId) {

        userInterestService.removeUserInterest(categoryId);

        AppResponse<Object> response = AppResponse.success(
                null,
                "Interest removed successfully",
                UserInterestRoutes.REMOVE_USER_INTEREST
        );
        return ResponseEntity.ok(response);
    }

    @Override
    @GetMapping(UserInterestRoutes.GET_USER_INTERESTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<PaginatedResponse<UserInterestResponseDTO>>> getUserInterests(Pageable pageable) {
        Page<UserInterestResponseDTO> interests = userInterestService.getUserInterests(pageable);
        PaginatedResponse<UserInterestResponseDTO> paginated = PaginatedResponse.fromPage(interests);
        AppResponse<PaginatedResponse<UserInterestResponseDTO>> response = AppResponse.success(
            paginated,
            "User interests retrieved successfully",
            UserInterestRoutes.GET_USER_INTERESTS
        );
        return ResponseEntity.ok(response);
    }

    @Override
    @PostMapping(UserInterestRoutes.ADD_USER_INTERESTS_BULK)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<Object>> addUserInterestsBulk(@Valid @RequestBody BulkUserInterestRequestDTO request) {

        userInterestService.addUserInterests(request.categoryIds());

        AppResponse<Object> response = AppResponse.success(
                null,
                "Interests added successfully",
                UserInterestRoutes.ADD_USER_INTERESTS_BULK
        );
        return ResponseEntity.ok(response);
    }

    @Override
    @DeleteMapping(UserInterestRoutes.REMOVE_USER_INTERESTS_BULK)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<Object>> removeUserInterestsBulk(@Valid @RequestBody BulkUserInterestRequestDTO request) {

        userInterestService.removeUserInterests(request.categoryIds());

        AppResponse<Object> response = AppResponse.success(
                null,
                "Interests removed successfully",
                UserInterestRoutes.REMOVE_USER_INTERESTS_BULK
        );
        return ResponseEntity.ok(response);
    }

    @Override
    @GetMapping(UserInterestRoutes.GET_USER_INTERESTS_BY_USER_ID)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<AppResponse<PaginatedResponse<UserInterestResponseDTO>>> getUserInterestsByUserId(@PathVariable Long userId, Pageable pageable) {
        Page<UserInterestResponseDTO> interests = userInterestService.getUserInterestsByUserId(userId, pageable);
        PaginatedResponse<UserInterestResponseDTO> paginated = PaginatedResponse.fromPage(interests);
        AppResponse<PaginatedResponse<UserInterestResponseDTO>> response = AppResponse.success(
            paginated,
            "User interests retrieved successfully",
            UserInterestRoutes.GET_USER_INTERESTS_BY_USER_ID
        );
        return ResponseEntity.ok(response);
    }

    @Override
    @GetMapping(UserInterestRoutes.ADMIN_GET_CATEGORY_ANALYTICS)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<AppResponse<PaginatedResponse<CategoryAnalyticsResponseDTO.CategoryStats>>> getCategoryAnalytics(Pageable pageable) {
        CategoryAnalyticsResponseDTO analytics = userInterestService.getCategoryInterestAnalytics(pageable);
        Page<CategoryAnalyticsResponseDTO.CategoryStats> statsPage = analytics.getCategoryStats();
        PaginatedResponse<CategoryAnalyticsResponseDTO.CategoryStats> paginated = PaginatedResponse.fromPage(statsPage);
        AppResponse<PaginatedResponse<CategoryAnalyticsResponseDTO.CategoryStats>> response = AppResponse.success(
            paginated,
            "Category interest analytics retrieved successfully",
            UserInterestRoutes.ADMIN_GET_CATEGORY_ANALYTICS
        );
        return ResponseEntity.ok(response);
    }
}
