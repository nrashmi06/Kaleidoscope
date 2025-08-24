package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostResponseDTO;
import com.kaleidoscope.backend.posts.exception.Posts.PostCategoryNotFoundException;
import com.kaleidoscope.backend.posts.exception.Posts.PostLocationNotFoundException;
import com.kaleidoscope.backend.posts.mapper.PostMapper;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.service.PostService;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.shared.repository.CategoryRepository;
import com.kaleidoscope.backend.shared.repository.LocationRepository;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {
    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final PostMapper postMapper;
    private final ImageStorageService imageStorageService; // For URL validation
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @Override
    @Transactional
    public PostResponseDTO createPost(PostCreateRequestDTO postCreateRequestDTO) {
        // 1. Get current authenticated user
        Long userId = jwtUtils.getUserIdFromContext();
        if(userId == null) {
            throw new IllegalStateException("Authenticated user ID not found in context");
        }
        User currentUser = userRepository.findByUserId(userId);

        // 2. Map core post details from DTO to entity
        Post post = postMapper.toEntity(postCreateRequestDTO);
        post.setUser(currentUser);

        // 3. Link location if provided
        if (postCreateRequestDTO.getLocationId() != null) {
            Location location = locationRepository.findById(postCreateRequestDTO.getLocationId())
                    .orElseThrow(() -> new PostLocationNotFoundException(postCreateRequestDTO.getLocationId()));
            post.setLocation(location);
        }

        // 4. Validate Media URLs and associate them
        if (postCreateRequestDTO.getMediaDetails() != null && !postCreateRequestDTO.getMediaDetails().isEmpty()) {
            postMapper.toPostMediaEntities(postCreateRequestDTO.getMediaDetails())
                .forEach(post::addMedia);
        }

        // 5. Fetch and associate categories
        Set<Category> categories = new HashSet<>(categoryRepository.findAllById(postCreateRequestDTO.getCategoryIds()));
        if (categories.size() != postCreateRequestDTO.getCategoryIds().size()) {
            throw new PostCategoryNotFoundException();
        }
        categories.forEach(post::addCategory); // Use helper method

        // 6. Save the post and its cascaded relations
        Post savedPost = postRepository.save(post);
        log.info("User '{}' created new post with ID: {}", currentUser.getUsername(), savedPost.getPostId());

        // 7. Map the saved entity to a response DTO and return
        return postMapper.toDTO(savedPost);
    }
}