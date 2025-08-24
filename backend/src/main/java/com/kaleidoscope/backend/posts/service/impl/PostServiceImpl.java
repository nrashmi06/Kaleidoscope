package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostResponseDTO;
import com.kaleidoscope.backend.posts.exception.Posts.PostCategoryNotFoundException;
import com.kaleidoscope.backend.posts.exception.Posts.PostLocationNotFoundException;
import com.kaleidoscope.backend.posts.mapper.PostMapper;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.service.PostService;
import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.shared.model.MediaAssetTracker;
import com.kaleidoscope.backend.shared.repository.CategoryRepository;
import com.kaleidoscope.backend.shared.repository.LocationRepository;
import com.kaleidoscope.backend.shared.repository.MediaAssetTrackerRepository;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
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
    private final MediaAssetTrackerRepository mediaAssetTrackerRepository;


    // Inside PostServiceImpl.java

    @Override
    @Transactional
    public PostResponseDTO createPost(PostCreateRequestDTO postCreateRequestDTO) {
        // 1. Get current authenticated user (no change)
        Long userId = jwtUtils.getUserIdFromContext();
        if(userId == null) {
            throw new IllegalStateException("Authenticated user ID not found in context");
        }
        User currentUser = userRepository.findByUserId(userId);

        // 2. Map core post details from DTO to entity (no change)
        Post post = postMapper.toEntity(postCreateRequestDTO);
        post.setUser(currentUser);

        // 3. Link location if provided (no change)
        if (postCreateRequestDTO.getLocationId() != null) {
            Location location = locationRepository.findById(postCreateRequestDTO.getLocationId())
                    .orElseThrow(() -> new PostLocationNotFoundException(postCreateRequestDTO.getLocationId()));
            post.setLocation(location);
        }

        // 4. Validate Media, associate them, AND UPDATE THE TRACKER
        // --- THIS IS THE MODIFIED SECTION ---
        if (postCreateRequestDTO.getMediaDetails() != null && !postCreateRequestDTO.getMediaDetails().isEmpty()) {

            List<MediaUploadRequestDTO> mediaDtos = postCreateRequestDTO.getMediaDetails();

            // First, create the PostMedia entities from the DTOs
            List<PostMedia> mediaItems = postMapper.toPostMediaEntities(mediaDtos);

            // Now, for each media item, find and update its tracker record
            for (PostMedia mediaItem : mediaItems) {
                // A. Validate the URL is one we trust (from our Cloudinary)
                if (!imageStorageService.validatePostImageUrl(mediaItem.getMediaUrl())) {
                    throw new IllegalArgumentException("Invalid or untrusted media URL: " + mediaItem.getMediaUrl());
                }

                // B. Extract the public_id from the URL to find the tracker
                String publicId = imageStorageService.extractPublicIdFromUrl(mediaItem.getMediaUrl());
                if (publicId == null || publicId.isEmpty()) {
                    throw new IllegalArgumentException("Could not extract public_id from URL: " + mediaItem.getMediaUrl());
                }

                // C. Find the tracker record in the database
                MediaAssetTracker tracker = mediaAssetTrackerRepository.findByPublicId(publicId)
                        .orElseThrow(() -> new IllegalStateException("Media asset not tracked for public_id: " + publicId));

                // D. Check if the asset is in the correct state to be associated
                if (tracker.getStatus() != MediaAssetStatus.UPLOADED) {
                    throw new IllegalStateException("Media asset is not in UPLOADED state. Current state: " + tracker.getStatus());
                }

                // E. Add the media to the post
                post.addMedia(mediaItem);

                // F. Update the tracker's status and link it to the post
                tracker.setStatus(MediaAssetStatus.ASSOCIATED);
                tracker.setPost(post);
                // No need to save the tracker here; the transaction will handle it when the post is saved.
            }
        }

        // 5. Fetch and associate categories (no change)
        Set<Category> categories = new HashSet<>(categoryRepository.findAllById(postCreateRequestDTO.getCategoryIds()));
        if (categories.size() != postCreateRequestDTO.getCategoryIds().size()) {
            throw new PostCategoryNotFoundException();
        }
        categories.forEach(post::addCategory);

        // 6. Save the post and its cascaded relations (no change)
        Post savedPost = postRepository.save(post);
        log.info("User '{}' created new post with ID: {}", currentUser.getUsername(), savedPost.getPostId());

        // 7. Map the saved entity to a response DTO and return (no change)
        return postMapper.toDTO(savedPost);
    }
}