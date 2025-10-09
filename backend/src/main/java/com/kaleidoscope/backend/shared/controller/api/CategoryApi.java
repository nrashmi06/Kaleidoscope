package com.kaleidoscope.backend.shared.controller.api;

import com.kaleidoscope.backend.shared.dto.request.CategoryRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryResponseDTO;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.response.AppResponse;
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

@Tag(name = "Category", description = "APIs for managing categories and category hierarchy")
public interface CategoryApi {

    @Operation(summary = "Get all parent categories", description = "Retrieves all top-level parent categories with pagination.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Parent categories retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<AppResponse<PaginatedResponse<CategoryResponseDTO>>> getAllParentCategories(
            @Parameter(description = "Pagination parameters") Pageable pageable);

    @Operation(summary = "Create a new category", description = "Creates a new category. Requires admin privileges.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Category created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    ResponseEntity<AppResponse<CategoryResponseDTO>> createCategory(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Category data to create", required = true,
                    content = @Content(schema = @Schema(implementation = CategoryRequestDTO.class)))
            @Valid @RequestBody CategoryRequestDTO categoryRequestDTO);

    @Operation(summary = "Update a category", description = "Updates an existing category by ID. Requires admin privileges.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Category not found")
    })
    ResponseEntity<AppResponse<CategoryResponseDTO>> updateCategory(
            @Parameter(description = "The ID of the category to update", required = true)
            @PathVariable Long categoryId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Updated category data", required = true,
                    content = @Content(schema = @Schema(implementation = CategoryRequestDTO.class)))
            @Valid @RequestBody CategoryRequestDTO categoryRequestDTO);

    @Operation(summary = "Delete a category", description = "Deletes a category by ID. Requires admin privileges.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category deleted successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Category not found")
    })
    ResponseEntity<AppResponse<String>> deleteCategory(
            @Parameter(description = "The ID of the category to delete", required = true)
            @PathVariable Long categoryId);

    @Operation(summary = "Get category by ID", description = "Retrieves a category with its children by ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Category not found")
    })
    ResponseEntity<AppResponse<CategoryResponseDTO>> getCategoryById(
            @Parameter(description = "The ID of the category to retrieve", required = true)
            @PathVariable Long categoryId);
}
