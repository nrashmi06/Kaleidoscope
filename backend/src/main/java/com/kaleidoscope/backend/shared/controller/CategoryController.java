package com.kaleidoscope.backend.shared.controller;

import com.kaleidoscope.backend.shared.dto.request.CategoryRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryParentListResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryResponseDTO;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.shared.routes.CategoryRoutes;
import com.kaleidoscope.backend.shared.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Category", description = "APIs for managing categories and category hierarchy")
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "Get all parent categories", description = "Retrieves all top-level parent categories.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Parent categories retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping(CategoryRoutes.GET_ALL_PARENT_CATEGORIES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CategoryParentListResponseDTO>> getAllParentCategories() {
        log.info("Getting all parent categories");
        CategoryParentListResponseDTO parentCategories = categoryService.getAllParentCategories();

        return ResponseEntity.ok(
                ApiResponse.<CategoryParentListResponseDTO>builder()
                        .success(true)
                        .message("Parent categories retrieved successfully")
                        .data(parentCategories)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(CategoryRoutes.GET_ALL_PARENT_CATEGORIES)
                        .build()
        );
    }

    @Operation(summary = "Create a new category", description = "Creates a new category. Requires admin privileges.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Category created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PostMapping(CategoryRoutes.CREATE_CATEGORY)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponseDTO>> createCategory(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Category data to create", required = true,
                    content = @Content(schema = @Schema(implementation = CategoryRequestDTO.class)))
            @Valid @RequestBody CategoryRequestDTO categoryRequestDTO) {
        log.info("Creating new category: {}", categoryRequestDTO.getName());
        CategoryResponseDTO createdCategory = categoryService.createCategory(categoryRequestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<CategoryResponseDTO>builder()
                        .success(true)
                        .message("Category created successfully")
                        .data(createdCategory)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(CategoryRoutes.CREATE_CATEGORY)
                        .build()
        );
    }

    @Operation(summary = "Update a category", description = "Updates an existing category by ID. Requires admin privileges.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Category updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Category not found")
    })
    @PutMapping(CategoryRoutes.UPDATE_CATEGORY)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponseDTO>> updateCategory(
            @Parameter(description = "The ID of the category to update", required = true)
            @PathVariable Long categoryId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Updated category data", required = true,
                    content = @Content(schema = @Schema(implementation = CategoryRequestDTO.class)))
            @Valid @RequestBody CategoryRequestDTO categoryRequestDTO) {
        log.info("Updating category ID: {}", categoryId);
        CategoryResponseDTO updatedCategory = categoryService.updateCategory(categoryId, categoryRequestDTO);

        return ResponseEntity.ok(
                ApiResponse.<CategoryResponseDTO>builder()
                        .success(true)
                        .message("Category updated successfully")
                        .data(updatedCategory)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(CategoryRoutes.UPDATE_CATEGORY)
                        .build()
        );
    }

    @Operation(summary = "Delete a category", description = "Deletes a category by ID. Requires admin privileges.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Category deleted successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Category not found")
    })
    @DeleteMapping(CategoryRoutes.DELETE_CATEGORY)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteCategory(
            @Parameter(description = "The ID of the category to delete", required = true)
            @PathVariable Long categoryId) {
        log.info("Deleting category ID: {}", categoryId);
        categoryService.deleteCategory(categoryId);

        return ResponseEntity.ok(
                ApiResponse.<String>builder()
                        .success(true)
                        .message("Category deleted successfully")
                        .data("Category with ID " + categoryId + " deleted successfully")
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(CategoryRoutes.DELETE_CATEGORY)
                        .build()
        );
    }

    @Operation(summary = "Get category by ID", description = "Retrieves a category with its children by ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Category retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Category not found")
    })
    @GetMapping(CategoryRoutes.GET_CATEGORY_BY_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CategoryResponseDTO>> getCategoryById(
            @Parameter(description = "The ID of the category to retrieve", required = true)
            @PathVariable Long categoryId) {
        log.info("Getting category by ID: {}", categoryId);
        CategoryResponseDTO category = categoryService.getCategoryWithChildren(categoryId);

        return ResponseEntity.ok(
                ApiResponse.<CategoryResponseDTO>builder()
                        .success(true)
                        .message("Category retrieved successfully")
                        .data(category)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(CategoryRoutes.GET_CATEGORY_BY_ID)
                        .build()
        );
    }
}