package com.kaleidoscope.backend.shared.controller;
import com.kaleidoscope.backend.shared.dto.response.CategoryParentListResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryParentResponseDTO;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.shared.dto.request.CategoryRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryListResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryResponseDTO;
import com.kaleidoscope.backend.shared.routes.CategoryRoutes;
import com.kaleidoscope.backend.shared.service.CategoryService;
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
public class CategoryController {

    private final CategoryService categoryService;


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

    @PostMapping(CategoryRoutes.CREATE_CATEGORY)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponseDTO>> createCategory(
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

    @PutMapping(CategoryRoutes.UPDATE_CATEGORY)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponseDTO>> updateCategory(
            @PathVariable Long categoryId,
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

    @DeleteMapping(CategoryRoutes.DELETE_CATEGORY)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteCategory(@PathVariable Long categoryId) {
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
    @GetMapping(CategoryRoutes.GET_CATEGORY_BY_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CategoryResponseDTO>> getCategoryById(@PathVariable Long categoryId) {
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