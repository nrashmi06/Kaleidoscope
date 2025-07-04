package com.kaleidoscope.backend.shared.service.impl;

import com.kaleidoscope.backend.shared.dto.request.CategoryRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryParentListResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryResponseDTO;
import com.kaleidoscope.backend.shared.exception.categoryException.CategoryAlreadyExistsException;
import com.kaleidoscope.backend.shared.exception.categoryException.CategoryNotFoundException;
import com.kaleidoscope.backend.shared.mapper.CategoryMapper;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.repository.CategoryRepository;
import com.kaleidoscope.backend.shared.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public CategoryResponseDTO createCategory(CategoryRequestDTO categoryRequestDTO) {
        // Check if a category with the same name already exists
        if (categoryRepository.findByName(categoryRequestDTO.getName()).isPresent()) {
            throw new CategoryAlreadyExistsException(categoryRequestDTO.getName());
        }

        // Create new category
        Category category = CategoryMapper.toEntity(categoryRequestDTO);

        // Set parent if specified
        if (categoryRequestDTO.getParentId() != null) {
            Category parent = getCategoryById(categoryRequestDTO.getParentId());
            category.setParent(parent);
        }

        // Save and return
        Category savedCategory = categoryRepository.save(category);
        log.info("Created new category with ID: {}", savedCategory.getCategoryId());
        return CategoryMapper.toDTO(savedCategory);
    }

    @Override
    @Transactional
    public CategoryResponseDTO updateCategory(Long categoryId, CategoryRequestDTO categoryRequestDTO) {
        // Find the category
        Category category = getCategoryById(categoryId);

        // Check if name change would cause a duplicate
        if (categoryRequestDTO.getName() != null &&
            !categoryRequestDTO.getName().equals(category.getName()) &&
            categoryRepository.findByName(categoryRequestDTO.getName()).isPresent()) {
            throw new CategoryAlreadyExistsException(categoryRequestDTO.getName());
        }

        // Update fields from DTO
        CategoryMapper.updateEntityFromDTO(category, categoryRequestDTO);

        // Update parent if specified
        if (categoryRequestDTO.getParentId() != null) {
            // Prevent circular reference
            if (categoryId.equals(categoryRequestDTO.getParentId())) {
                throw new IllegalArgumentException("A category cannot be its own parent");
            }
            Category parent = getCategoryById(categoryRequestDTO.getParentId());
            category.setParent(parent);
        }

        // Save and return
        Category updatedCategory = categoryRepository.save(category);
        log.info("Updated category with ID: {}", categoryId);
        return CategoryMapper.toDTO(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(Long categoryId) {
        Category category = getCategoryById(categoryId);
        categoryRepository.delete(category);
        log.info("Deleted category with ID: {}", categoryId);
    }

    @Override
    public CategoryParentListResponseDTO getAllParentCategories() {
        List<Category> parentCategories = categoryRepository.findByParentIsNull();
        return CategoryMapper.toParentListDTO(parentCategories);
    }

    @Override
    @Transactional(readOnly = true)
    public Category getCategoryById(Long categoryId) {
        return categoryRepository.findById(categoryId)
            .orElseThrow(() -> new CategoryNotFoundException(categoryId));
    }

    @Override
    public CategoryResponseDTO getCategoryWithChildren(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + categoryId));

        // Get all categories to build the hierarchy
        List<Category> allCategories = categoryRepository.findAll();

        // Use mapper method instead of inline mapping logic
        return CategoryMapper.toDTOWithChildren(category, allCategories);
    }
}
