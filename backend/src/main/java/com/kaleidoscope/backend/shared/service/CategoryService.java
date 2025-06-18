package com.kaleidoscope.backend.shared.service;

import com.kaleidoscope.backend.shared.dto.request.CategoryRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryParentListResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryResponseDTO;
import com.kaleidoscope.backend.shared.exception.categoryException.CategoryNotFoundException;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.dto.response.CategoryParentListResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryParentResponseDTO;
/**
 * Service for managing categories
 */
public interface CategoryService {

    /**
     * Create a new category
     *
     * @param categoryRequestDTO the category data
     * @return the created category
     */
    CategoryResponseDTO createCategory(CategoryRequestDTO categoryRequestDTO);

    /**
     * Update an existing category
     *
     * @param categoryId the ID of the category to update
     * @param categoryRequestDTO the updated category data
     * @return the updated category
     */
    CategoryResponseDTO updateCategory(Long categoryId, CategoryRequestDTO categoryRequestDTO);

    /**
     * Delete a category
     *
     * @param categoryId the ID of the category to delete
     */
    void deleteCategory(Long categoryId);

    /**
     * Get all categories
     *
     * @return list of all categories
     */
    CategoryParentListResponseDTO getAllParentCategories();

    /**
     * Get a category by its ID
     *
     * @param categoryId the ID of the category
     * @return the category entity
     * @throws CategoryNotFoundException if the category is not found
     */
    Category getCategoryById(Long categoryId);

    CategoryResponseDTO getCategoryWithChildren(Long categoryId);
}