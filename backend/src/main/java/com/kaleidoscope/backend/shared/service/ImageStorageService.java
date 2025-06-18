package com.kaleidoscope.backend.shared.service;

import com.kaleidoscope.backend.shared.dto.request.CategoryRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryListResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryResponseDTO;
import com.kaleidoscope.backend.shared.model.Category;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.CompletableFuture;

public interface ImageStorageService {
    CompletableFuture<String> uploadImage(MultipartFile image) throws Exception;
    CompletableFuture<Void> deleteImage(String imageUrl) throws Exception;

    interface CategoryService {
        /**
         * Create a new category
         *
         * @param categoryRequestDTO Category data
         * @return Created category
         */
        CategoryResponseDTO createCategory(CategoryRequestDTO categoryRequestDTO);

        /**
         * Update an existing category
         *
         * @param categoryId Category ID to update
         * @param categoryRequestDTO Updated category data
         * @return Updated category
         */
        CategoryResponseDTO updateCategory(Long categoryId, CategoryRequestDTO categoryRequestDTO);

        /**
         * Delete a category
         *
         * @param categoryId Category ID to delete
         */
        void deleteCategory(Long categoryId);

        /**
         * Get all categories
         *
         * @return List of all categories
         */
        CategoryListResponseDTO getAllCategories();

        /**
         * Get a category by ID
         *
         * @param categoryId Category ID
         * @return Category with the specified ID
         */
        Category getCategoryById(Long categoryId);
    }
}