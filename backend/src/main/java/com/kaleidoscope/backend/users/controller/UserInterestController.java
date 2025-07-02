package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.AddUserInterestRequestDTO;
import com.kaleidoscope.backend.users.dto.request.BulkUserInterestRequestDTO;
import com.kaleidoscope.backend.users.dto.response.CategoryAnalyticsResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserInterestListResponseDTO;
import com.kaleidoscope.backend.users.routes.UserInterestRoutes;
import com.kaleidoscope.backend.users.service.UserInterestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@Slf4j
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "User Interest", description = "APIs for managing user interests")
public class UserInterestController {

    private final UserInterestService userInterestService;

    @Operation(summary = "Add user interest", description = "Add a category interest for the authenticated user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Interest added successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input or interest already exists"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Category not found")
    })
    @PostMapping(UserInterestRoutes.ADD_USER_INTEREST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> addUserInterest(
            @Parameter(description = "User interest request", required = true)
            @Valid @RequestBody AddUserInterestRequestDTO request) {

        userInterestService.addUserInterest(request.getCategoryId());

        ApiResponse<Object> response = ApiResponse.success(
                null,
                "Interest added successfully",
                UserInterestRoutes.ADD_USER_INTEREST
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Remove user interest", description = "Remove a category interest for the authenticated user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Interest removed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Interest not found")
    })
    @DeleteMapping(UserInterestRoutes.REMOVE_USER_INTEREST)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> removeUserInterest(
            @Parameter(description = "Category ID", required = true)
            @PathVariable Long categoryId) {

        userInterestService.removeUserInterest(categoryId);

        ApiResponse<Object> response = ApiResponse.success(
                null,
                "Interest removed successfully",
                UserInterestRoutes.REMOVE_USER_INTEREST
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get user interests", description = "Get interests for the authenticated user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User interests retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping(UserInterestRoutes.GET_USER_INTERESTS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserInterestListResponseDTO>> getUserInterests(
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {

        UserInterestListResponseDTO interests = userInterestService.getUserInterests(pageable);

        ApiResponse<UserInterestListResponseDTO> response = ApiResponse.success(
                interests,
                "User interests retrieved successfully",
                UserInterestRoutes.GET_USER_INTERESTS
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Add multiple user interests", description = "Add multiple category interests for the authenticated user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Interests added successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Category not found")
    })
    @PostMapping(UserInterestRoutes.ADD_USER_INTERESTS_BULK)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> addUserInterestsBulk(
            @Parameter(description = "Bulk user interests request", required = true)
            @Valid @RequestBody BulkUserInterestRequestDTO request) {

        userInterestService.addUserInterests(request.getCategoryIds());

        ApiResponse<Object> response = ApiResponse.success(
                null,
                "Interests added successfully",
                UserInterestRoutes.ADD_USER_INTERESTS_BULK
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Remove multiple user interests", description = "Remove multiple category interests for the authenticated user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Interests removed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @DeleteMapping(UserInterestRoutes.REMOVE_USER_INTERESTS_BULK)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> removeUserInterestsBulk(
            @Parameter(description = "Bulk user interests request", required = true)
            @Valid @RequestBody BulkUserInterestRequestDTO request) {

        userInterestService.removeUserInterests(request.getCategoryIds());

        ApiResponse<Object> response = ApiResponse.success(
                null,
                "Interests removed successfully",
                UserInterestRoutes.REMOVE_USER_INTERESTS_BULK
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get user interests by user ID", description = "Get interests for a specific user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User interests retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping(UserInterestRoutes.GET_USER_INTERESTS_BY_USER_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserInterestListResponseDTO>> getUserInterestsByUserId(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {

        UserInterestListResponseDTO interests = userInterestService.getUserInterestsByUserId(userId, pageable);

        ApiResponse<UserInterestListResponseDTO> response = ApiResponse.success(
                interests,
                "User interests retrieved successfully",
                UserInterestRoutes.GET_USER_INTERESTS_BY_USER_ID
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Admin: Get category interest analytics", description = "Get analytics showing how many users are interested in each category with pagination")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Category analytics retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
    })
    @GetMapping(UserInterestRoutes.ADMIN_GET_CATEGORY_ANALYTICS)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<CategoryAnalyticsResponseDTO>> getCategoryAnalytics(
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {

        CategoryAnalyticsResponseDTO analytics = userInterestService.getCategoryInterestAnalytics(pageable);

        ApiResponse<CategoryAnalyticsResponseDTO> response = ApiResponse.success(
                analytics,
                "Category interest analytics retrieved successfully",
                UserInterestRoutes.ADMIN_GET_CATEGORY_ANALYTICS
        );
        return ResponseEntity.ok(response);
    }
}
