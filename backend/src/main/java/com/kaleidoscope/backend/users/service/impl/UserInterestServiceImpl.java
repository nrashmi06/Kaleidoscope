package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.repository.CategoryRepository;
import com.kaleidoscope.backend.shared.service.CategoryService;
import com.kaleidoscope.backend.users.dto.response.CategoryAnalyticsResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserInterestResponseDTO;
import com.kaleidoscope.backend.users.exception.userinterest.UserInterestAlreadyExistsException;
import com.kaleidoscope.backend.users.exception.userinterest.UserInterestNotFoundException;
import com.kaleidoscope.backend.users.mapper.CategoryAnalyticsMapper;
import com.kaleidoscope.backend.users.mapper.UserInterestBulkOperationsMapper;
import com.kaleidoscope.backend.users.mapper.UserInterestFilterMapper;
import com.kaleidoscope.backend.users.mapper.UserInterestMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserInterest;
import com.kaleidoscope.backend.users.repository.UserInterestRepository;
import com.kaleidoscope.backend.users.service.UserInterestService;
import com.kaleidoscope.backend.users.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserInterestServiceImpl implements UserInterestService {

    private final UserInterestRepository userInterestRepository;
    private final UserService userService;
    private final CategoryService categoryService;
    private final JwtUtils jwtUtils;
    private final UserInterestMapper userInterestMapper;
    private final CategoryRepository categoryRepository;
    private final UserInterestFilterMapper filterMapper;
    private final UserInterestBulkOperationsMapper bulkOperationsMapper;
    private final CategoryAnalyticsMapper analyticsMapper;
    private final com.kaleidoscope.backend.users.service.UserDocumentSyncService userDocumentSyncService;

    @Override
    @Transactional
    public void addUserInterest(Long categoryId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();

        if (userInterestRepository.existsByUser_UserIdAndCategory_CategoryId(currentUserId, categoryId)) {
            throw new UserInterestAlreadyExistsException("User already has this interest");
        }

        UserInterest userInterest = UserInterest.builder()
                .user(userService.getUserById(currentUserId))
                .category(categoryService.getCategoryById(categoryId))
                .build();

        userInterestRepository.save(userInterest);
        log.info("Added interest for user ID: {} with category ID: {}", currentUserId, categoryId);

        // Sync to Elasticsearch
        userDocumentSyncService.syncOnInterestChange(currentUserId);
    }

    @Override
    @Transactional
    public void removeUserInterest(Long categoryId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();

        UserInterest userInterest = userInterestRepository
                .findByUser_UserIdAndCategory_CategoryId(currentUserId, categoryId)
                .orElseThrow(() -> new UserInterestNotFoundException("User interest not found"));

        userInterestRepository.delete(userInterest);
        log.info("Removed interest for user ID: {} with category ID: {}", currentUserId, categoryId);

        // Sync to Elasticsearch
        userDocumentSyncService.syncOnInterestChange(currentUserId);
    }

    @Override
    @Transactional
    public void addUserInterests(List<Long> categoryIds) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        User currentUser = userService.getUserById(currentUserId);

        // Use filter mapper to get existing interests and filter new ones
        Set<Long> existingInterests = filterMapper.extractCategoryIds(
                userInterestRepository.findByUser_UserId(currentUserId, Pageable.unpaged()).getContent()
        );

        List<Long> newCategoryIds = filterMapper.filterNewCategoryIds(categoryIds, existingInterests);

        if (newCategoryIds.isEmpty()) {
            log.info("No new interests to add for user ID: {}", currentUserId);
            return;
        }

        // Batch fetch categories and validate using bulk operations mapper
        Map<Long, Category> categoryMap = categoryRepository.findAllById(newCategoryIds)
                .stream()
                .collect(Collectors.toMap(Category::getCategoryId, category -> category));

        bulkOperationsMapper.validateCategoriesExist(newCategoryIds, categoryMap);

        // Use bulk operations mapper to create user interests
        List<UserInterest> userInterests = bulkOperationsMapper.buildUserInterests(
                newCategoryIds, currentUser, categoryMap);

        userInterestRepository.saveAll(userInterests);
        log.info("Added {} interests for user ID: {}", newCategoryIds.size(), currentUserId);

        // Sync to Elasticsearch
        userDocumentSyncService.syncOnInterestChange(currentUserId);
    }

    @Override
    @Transactional
    public void removeUserInterests(List<Long> categoryIds) {
        Long currentUserId = jwtUtils.getUserIdFromContext();

        // Find existing user interests to remove
        List<UserInterest> interestsToRemove = userInterestRepository
                .findByUser_UserIdAndCategory_CategoryIdIn(currentUserId, categoryIds);

        if (interestsToRemove.isEmpty()) {
            log.info("No interests found to remove for user ID: {}", currentUserId);
            return;
        }

        userInterestRepository.deleteAll(interestsToRemove);
        log.info("Removed {} interests for user ID: {}", interestsToRemove.size(), currentUserId);

        // Sync to Elasticsearch
        userDocumentSyncService.syncOnInterestChange(currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserInterestResponseDTO> getUserInterests(Pageable pageable) {
        Long userId = jwtUtils.getUserIdFromContext();
        userService.getUserById(userId); // Verify user exists
        Page<UserInterest> userInterests = userInterestRepository.findByUser_UserId(userId, pageable);
        // Optionally filter redundant child interests here if needed
        return userInterestMapper.toResponseDTOPage(userInterests);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserInterestResponseDTO> getUserInterestsByUserId(Long userId, Pageable pageable) {
        userService.getUserById(userId); // Verify user exists
        Page<UserInterest> userInterests = userInterestRepository.findByUser_UserId(userId, pageable);
        // Optionally filter redundant child interests here if needed
        return userInterestMapper.toResponseDTOPage(userInterests);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryAnalyticsResponseDTO getCategoryInterestAnalytics(Pageable pageable) {
        Page<Category> categoryPage = categoryRepository.findAll(pageable);
        List<Long> categoryIds = bulkOperationsMapper.extractCategoryIds(categoryPage.getContent());
        Long totalUsers = userInterestRepository.countDistinctByUser();
        Map<Long, Long> userCountMap = userInterestRepository.countUsersByCategoryIds(categoryIds)
                .stream()
                .collect(Collectors.toMap(
                    row -> (Long) row[0],
                    row -> (Long) row[1]
                ));
        Page<CategoryAnalyticsResponseDTO.CategoryStats> categoryStatsPage =
                analyticsMapper.buildCategoryStatsPage(categoryPage, userCountMap, totalUsers);
        Long totalCategories = categoryRepository.count();
        return analyticsMapper.toCategoryAnalyticsResponse(categoryStatsPage, totalUsers, totalCategories);
    }
}
