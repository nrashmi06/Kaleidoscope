package com.kaleidoscope.backend.users.controller.api;

import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.dto.request.AddUserInterestRequestDTO;
import com.kaleidoscope.backend.users.dto.request.BulkUserInterestRequestDTO;
import com.kaleidoscope.backend.users.dto.response.CategoryAnalyticsResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserInterestResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

@Tag(name = "User Interest", description = "APIs for managing user interests")
public interface UserInterestApi {

    @Operation(summary = "Add user interest", description = "Add a category interest for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Interest added successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or interest already exists"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Category not found")
    })
    ResponseEntity<AppResponse<Object>> addUserInterest(
            @Parameter(description = "User interest request", required = true)
            @Valid @RequestBody AddUserInterestRequestDTO request);

    @Operation(summary = "Remove user interest", description = "Remove a category interest for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Interest removed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Interest not found")
    })
    ResponseEntity<AppResponse<Object>> removeUserInterest(
            @Parameter(description = "Category ID", required = true)
            @PathVariable Long categoryId);

    @Operation(summary = "Get user interests", description = "Get interests for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User interests retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<AppResponse<PaginatedResponse<UserInterestResponseDTO>>> getUserInterests(
            @Parameter(description = "Pagination parameters")
            Pageable pageable);

    @Operation(summary = "Add multiple user interests", description = "Add multiple category interests for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Interests added successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Category not found")
    })
    ResponseEntity<AppResponse<Object>> addUserInterestsBulk(
            @Parameter(description = "Bulk user interests request", required = true)
            @Valid @RequestBody BulkUserInterestRequestDTO request);

    @Operation(summary = "Remove multiple user interests", description = "Remove multiple category interests for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Interests removed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<AppResponse<Object>> removeUserInterestsBulk(
            @Parameter(description = "Bulk user interests request", required = true)
            @Valid @RequestBody BulkUserInterestRequestDTO request);

    @Operation(summary = "Get user interests by user ID", description = "Get interests for a specific user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User interests retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<AppResponse<PaginatedResponse<UserInterestResponseDTO>>> getUserInterestsByUserId(
            @Parameter(description = "User ID", required = true) @PathVariable Long userId,
            @Parameter(description = "Pagination parameters") Pageable pageable);

    @Operation(summary = "Admin: Get category interest analytics", description = "Get analytics showing how many users are interested in each category with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category analytics retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
    })
    ResponseEntity<AppResponse<PaginatedResponse<CategoryAnalyticsResponseDTO.CategoryStats>>> getCategoryAnalytics(
            @Parameter(description = "Pagination parameters") Pageable pageable);
}
