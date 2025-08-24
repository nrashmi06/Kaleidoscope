package com.kaleidoscope.backend.shared.mapper;

import com.kaleidoscope.backend.shared.dto.request.CategoryRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryParentResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CategoryResponseDTO;
import com.kaleidoscope.backend.shared.model.Category;
import org.springframework.data.domain.Page;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class CategoryMapper {

    public static CategoryResponseDTO toDTO(Category category) {
        if (category == null) {
            return null;
        }

        return CategoryResponseDTO.builder()
                .categoryId(category.getCategoryId())
                .name(category.getName())
                .description(category.getDescription())
                .iconName(category.getIconName())
                .parentId(category.getParent() != null ? category.getParent().getCategoryId() : null)
                .subcategories(new HashSet<>()) // Initialize empty set
                .build();
    }

    public static CategoryParentResponseDTO toParentDTO(Category category) {
        if (category == null) {
            return null;
        }

        return CategoryParentResponseDTO.builder()
                .categoryId(category.getCategoryId())
                .name(category.getName())
                .description(category.getDescription())
                .iconName(category.getIconName())
                .parentId(category.getParent() != null ? category.getParent().getCategoryId() : null)
                .build();
    }

    public static List<CategoryParentResponseDTO> toParentDTOList(List<Category> categories) {
        return categories.stream()
                .map(CategoryMapper::toParentDTO)
                .toList();
    }


    public static CategoryResponseDTO toDTOWithChildren(Category category, List<Category> allCategories) {
        if (category == null) {
            return null;
        }

        // Build the hierarchical structure
        Map<Long, CategoryResponseDTO> dtoMap = allCategories.stream()
                .map(CategoryMapper::toDTO)
                .collect(Collectors.toMap(CategoryResponseDTO::getCategoryId, dto -> dto));

        // Connect children to parents
        for (CategoryResponseDTO dto : dtoMap.values()) {
            if (dto.getParentId() != null && dtoMap.containsKey(dto.getParentId())) {
                CategoryResponseDTO parent = dtoMap.get(dto.getParentId());
                parent.getSubcategories().add(dto);
            }
        }

        return dtoMap.get(category.getCategoryId());
    }

    public static List<CategoryResponseDTO> toDTOList(List<Category> categories) {
        return categories.stream()
                .map(CategoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    public static List<CategoryResponseDTO> toHierarchicalDTOList(List<Category> allCategories) {
        // First, convert all to DTOs
        Map<Long, CategoryResponseDTO> dtoMap = allCategories.stream()
                .map(category -> {
                    CategoryResponseDTO dto = toDTO(category);
                    return dto; // subcategories already initialized in toDTO
                })
                .collect(Collectors.toMap(CategoryResponseDTO::getCategoryId, dto -> dto));

        // List to hold only root categories
        List<CategoryResponseDTO> rootCategories = new ArrayList<>();

        // Build the hierarchy
        for (CategoryResponseDTO dto : dtoMap.values()) {
            if (dto.getParentId() == null) {
                // This is a root category
                rootCategories.add(dto);
            } else {
                // This is a child category - add it to its parent
                CategoryResponseDTO parent = dtoMap.get(dto.getParentId());
                if (parent != null) {
                    parent.getSubcategories().add(dto);
                }
            }
        }

        return rootCategories;
    }


    public static Category toEntity(CategoryRequestDTO dto) {
        return Category.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .iconName(dto.getIconName())
                .build();
    }

    public static void updateEntityFromDTO(Category category, CategoryRequestDTO dto) {
        if (dto.getName() != null) {
            category.setName(dto.getName());
        }

        if (dto.getDescription() != null) {
            category.setDescription(dto.getDescription());
        }

        if (dto.getIconName() != null) {
            category.setIconName(dto.getIconName());
        }
    }

    public static Page<CategoryResponseDTO> toDTOPage(Page<Category> categoryPage) {
        return categoryPage.map(CategoryMapper::toDTO);
    }
}