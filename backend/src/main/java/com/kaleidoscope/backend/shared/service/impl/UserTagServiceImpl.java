package com.kaleidoscope.backend.shared.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.dto.request.CreateUserTagRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.exception.userTags.TagNotFoundException;
import com.kaleidoscope.backend.shared.exception.userTags.UserTaggingException;
import com.kaleidoscope.backend.shared.mapper.UserTagMapper;
import com.kaleidoscope.backend.shared.model.UserTag;
import com.kaleidoscope.backend.shared.repository.UserTagRepository;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.service.UserTagService;
import com.kaleidoscope.backend.users.document.UserDocument;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserBlockRepository;
import com.kaleidoscope.backend.users.repository.UserPreferencesRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.users.repository.search.UserSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserTagServiceImpl implements UserTagService {

    private final UserTagRepository userTagRepository;
    private final UserRepository userRepository;
    private final UserBlockRepository userBlockRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final UserTagMapper userTagMapper;
    private final JwtUtils jwtUtils;
    private final UserSearchRepository userSearchRepository;

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<UserDetailsSummaryResponseDTO> findTaggableUsers(String query, Pageable pageable) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Finding taggable users for user {} with query: {}", currentUserId, query);

        try {
            // Fetch current user's document to get block lists
            Optional<UserDocument> currentUserDocOpt = userSearchRepository.findById(currentUserId.toString());

            final List<Long> blockedUserIds;
            final List<Long> blockedByUserIds;

            if (currentUserDocOpt.isPresent()) {
                UserDocument currentUserDoc = currentUserDocOpt.get();
                blockedUserIds = currentUserDoc.getBlockedUserIds() != null ? currentUserDoc.getBlockedUserIds() : new ArrayList<>();
                blockedByUserIds = currentUserDoc.getBlockedByUserIds() != null ? currentUserDoc.getBlockedByUserIds() : new ArrayList<>();
            } else {
                log.warn("UserDocument not found for current user ID: {} during taggable user search", currentUserId);
                blockedUserIds = new ArrayList<>();
                blockedByUserIds = new ArrayList<>();
            }

            // Use custom repository method
            Page<UserDocument> userDocumentPage = userSearchRepository.findTaggableUsers(
                    currentUserId,
                    blockedUserIds,
                    blockedByUserIds,
                    query,
                    pageable
            );

            // Map to DTOs
            Page<UserDetailsSummaryResponseDTO> dtoPage = userDocumentPage.map(UserMapper::toUserDetailsSummaryResponseDTO);

            log.info("Successfully found {} taggable users using custom repository for user {}", dtoPage.getTotalElements(), currentUserId);
            return PaginatedResponse.fromPage(dtoPage);

        } catch (Exception e) {
            log.error("Failed to find taggable users from Elasticsearch for user {}, returning empty page", currentUserId, e);
            return PaginatedResponse.fromPage(Page.empty(pageable));
        }
    }

    @Override
    @Transactional
    public UserTagResponseDTO createUserTag(CreateUserTagRequestDTO requestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Creating user tag by user {} for user {} on content {}:{}",
                currentUserId, requestDTO.taggedUserId(), requestDTO.contentType(), requestDTO.contentId());

        // Validate that users can interact (no blocking)
        if (userBlockRepository.existsBlockRelationship(currentUserId, requestDTO.taggedUserId())) {
            throw new UserTaggingException("Cannot tag blocked user");
        }

        // Get users
        User taggerUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UserTaggingException("Tagger user not found"));
        User taggedUser = userRepository.findById(requestDTO.taggedUserId())
                .orElseThrow(() -> new UserTaggingException("Tagged user not found"));

        // Check if tag already exists
        if (userTagRepository.existsByTaggedUserAndContentTypeAndContentId(
                taggedUser, requestDTO.contentType(), requestDTO.contentId())) {
            throw new UserTaggingException("User is already tagged in this content");
        }

        // Create and save tag
        UserTag userTag = UserTag.builder()
                .taggedUser(taggedUser)
                .taggerUser(taggerUser)
                .contentType(requestDTO.contentType())
                .contentId(requestDTO.contentId())
                .build();

        UserTag savedTag = userTagRepository.save(userTag);
        log.info("Created user tag with ID: {}", savedTag.getTagId());

        return userTagMapper.toDTO(savedTag);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<UserTagResponseDTO> getTagsForContent(ContentType contentType, Long contentId, Pageable pageable) {
        log.info("Getting tags for content {}:{}", contentType, contentId);

        Page<UserTag> tags = userTagRepository.findByContentTypeAndContentId(contentType, contentId, pageable);
        Page<UserTagResponseDTO> dtoPage = tags.map(userTagMapper::toDTO);

        return PaginatedResponse.fromPage(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<UserTagResponseDTO> getContentUserIsTaggedIn(Long userId, Pageable pageable) {
        log.info("Getting content where user {} is tagged", userId);

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new UserTaggingException("User not found");
        }

        Page<UserTag> tags = userTagRepository.findByTaggedUserUserId(userId, pageable);
        Page<UserTagResponseDTO> dtoPage = tags.map(userTagMapper::toDTO);

        return PaginatedResponse.fromPage(dtoPage);
    }

    @Override
    @Transactional
    public void deleteTag(Long tagId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();

        log.info("Deleting tag {} by user {}", tagId, currentUserId);

        UserTag tag = userTagRepository.findById(tagId)
                .orElseThrow(() -> new TagNotFoundException("Tag not found with ID: " + tagId));

        // Check authorization: tagged user, tagger user, or admin can delete
        if (!isAdmin &&
                !tag.getTaggedUser().getUserId().equals(currentUserId) &&
                !tag.getTaggerUser().getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("Not authorized to delete this tag");
        }

        userTagRepository.delete(tag);
        log.info("Successfully deleted tag with ID: {}", tagId);
    }
}

