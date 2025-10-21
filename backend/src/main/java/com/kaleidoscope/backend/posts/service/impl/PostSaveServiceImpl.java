package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.dto.response.PostSaveResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.exception.Posts.PostNotFoundException;
import com.kaleidoscope.backend.posts.mapper.PostMapper;
import com.kaleidoscope.backend.posts.mapper.PostSaveMapper;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostSave;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.repository.PostSaveRepository;
import com.kaleidoscope.backend.posts.service.PostSaveService;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostSaveServiceImpl implements PostSaveService {

    private final PostSaveRepository postSaveRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final PostMapper postMapper;

    @Override
    @Transactional
    public PostSaveResponseDTO saveOrUnsavePost(Long postId, boolean unsave) {
        log.info("Processing save/unsave request for postId: {}, unsave: {}", postId, unsave);
        
        Long userId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            throw new IllegalArgumentException("Authenticated user not found for ID: " + userId);
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostNotFoundException(postId));

        Optional<PostSave> existingSave = postSaveRepository.findByPostAndUser(post, currentUser);

        if (unsave) {
            if (existingSave.isPresent()) {
                postSaveRepository.deleteByPostAndUser(post, currentUser);
                log.info("Post unsaved successfully: postId={}, userId={}", postId, userId);
            } else {
                log.warn("Attempting to unsave a post that wasn't saved: postId={}, userId={}", postId, userId);
            }
        } else {
            if (existingSave.isEmpty()) {
                // Use mapper to create PostSave entity
                PostSave postSave = PostSaveMapper.toEntity(post, currentUser);
                postSaveRepository.save(postSave);
                log.info("Post saved successfully: postId={}, userId={}", postId, userId);
            } else {
                log.info("Post already saved by user: postId={}, userId={}", postId, userId);
            }
        }

        return buildResponse(post, currentUser);
    }

    @Override
    public PostSaveResponseDTO getPostSaveStatus(Long postId) {
        log.info("Getting save status for postId: {}", postId);
        
        Long userId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            throw new IllegalArgumentException("Authenticated user not found for ID: " + userId);
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostNotFoundException(postId));

        return buildResponse(post, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<PostSummaryResponseDTO> getSavedPosts(Pageable pageable) {
        log.info("Getting saved posts for current user with pagination: page={}, size={}",
                pageable.getPageNumber(), pageable.getPageSize());

        Long userId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            throw new IllegalArgumentException("Authenticated user not found for ID: " + userId);
        }

        // Get saved posts with pagination
        Page<PostSave> savedPostsPage = postSaveRepository.findByUserOrderByCreatedAtDesc(currentUser, pageable);

        // Extract posts and map to PostSummaryResponseDTO
        List<PostSummaryResponseDTO> postSummaries = savedPostsPage.getContent()
                .stream()
                .map(PostSave::getPost)
                .map(postMapper::toPostSummaryDTO)
                .toList();

        Page<PostSummaryResponseDTO> dtoPage = new PageImpl<>(
                postSummaries,
                pageable,
                savedPostsPage.getTotalElements()
        );

        log.info("Retrieved {} saved posts for user {}", postSummaries.size(), userId);
        return PaginatedResponse.fromPage(dtoPage);
    }

    private PostSaveResponseDTO buildResponse(Post post, User user) {
        Optional<PostSave> userSave = postSaveRepository.findByPostAndUser(post, user);
        long totalSaves = postSaveRepository.countByPost(post);

        // Use mapper to create response DTO
        return PostSaveMapper.toResponseDTO(userSave, totalSaves);
    }
}
