package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostResponseDTO;
import com.kaleidoscope.backend.posts.exception.Posts.PostCategoryNotFoundException;
import com.kaleidoscope.backend.posts.exception.Posts.PostLocationNotFoundException;
import com.kaleidoscope.backend.posts.exception.Posts.PostNotFoundException;
import com.kaleidoscope.backend.posts.exception.Posts.UnauthorizedActionException;
import com.kaleidoscope.backend.posts.exception.Posts.IllegalStatePostActionException;
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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final PostMapper postMapper;
    private final ImageStorageService imageStorageService;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final MediaAssetTrackerRepository mediaAssetTrackerRepository;

    @Override
    @Transactional
    public PostResponseDTO createPost(PostCreateRequestDTO postCreateRequestDTO) {
        Long userId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            throw new IllegalStatePostActionException("Authenticated user not found for ID: " + userId);
        }

        Post post = postMapper.toEntity(postCreateRequestDTO);
        post.setUser(currentUser);

        if (postCreateRequestDTO.getLocationId() != null) {
            Location location = locationRepository.findById(postCreateRequestDTO.getLocationId())
                    .orElseThrow(() -> new PostLocationNotFoundException(postCreateRequestDTO.getLocationId()));
            post.setLocation(location);
        }

        if (postCreateRequestDTO.getMediaDetails() != null && !postCreateRequestDTO.getMediaDetails().isEmpty()) {
            List<PostMedia> mediaItems = postMapper.toPostMediaEntities(postCreateRequestDTO.getMediaDetails());
            for (PostMedia mediaItem : mediaItems) {
                if (!imageStorageService.validatePostImageUrl(mediaItem.getMediaUrl())) {
                    throw new IllegalArgumentException("Invalid or untrusted media URL: " + mediaItem.getMediaUrl());
                }
                String publicId = imageStorageService.extractPublicIdFromUrl(mediaItem.getMediaUrl());
                MediaAssetTracker tracker = mediaAssetTrackerRepository.findByPublicId(publicId)
                        .orElseThrow(() -> new IllegalStatePostActionException("Media asset not tracked for public_id: " + publicId));

                if (tracker.getStatus() != MediaAssetStatus.PENDING) {
                    throw new IllegalStatePostActionException("Media asset must be in PENDING state to be associated. Current state: " + tracker.getStatus());
                }
                post.addMedia(mediaItem);
                tracker.setStatus(MediaAssetStatus.ASSOCIATED);
                tracker.setPost(post);
            }
        }

        Set<Category> categories = new HashSet<>(categoryRepository.findAllById(postCreateRequestDTO.getCategoryIds()));
        if (categories.size() != postCreateRequestDTO.getCategoryIds().size()) {
            throw new PostCategoryNotFoundException();
        }
        categories.forEach(post::addCategory);

        Post savedPost = postRepository.save(post);
        log.info("User '{}' created new post with ID: {}", currentUser.getUsername(), savedPost.getPostId());
        return postMapper.toDTO(savedPost);
    }

    @Override
    @Transactional
    public PostResponseDTO updatePost(Long postId, PostUpdateRequestDTO requestDTO) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostNotFoundException(postId));

        Long currentUserId = jwtUtils.getUserIdFromContext();
        if (!post.getUser().getUserId().equals(currentUserId)) {
            throw new UnauthorizedActionException("User is not authorized to edit this post.");
        }

        post.setTitle(requestDTO.getTitle());
        post.setBody(requestDTO.getBody());
        post.setSummary(requestDTO.getSummary());
        post.setVisibility(requestDTO.getVisibility());
        post.setType(requestDTO.getType());

        updatePostMedia(post, requestDTO.getMediaDetails());

        if (requestDTO.getCategoryIds() != null) {
            Set<Category> categories = new HashSet<>(categoryRepository.findAllById(requestDTO.getCategoryIds()));
            if (categories.size() != requestDTO.getCategoryIds().size()) {
                throw new PostCategoryNotFoundException();
            }
            post.getCategories().clear();
            categories.forEach(post::addCategory);
        }

        if (requestDTO.getLocationId() != null) {
            Location location = locationRepository.findById(requestDTO.getLocationId())
                    .orElseThrow(() -> new PostLocationNotFoundException(requestDTO.getLocationId()));
            post.setLocation(location);
        } else {
            post.setLocation(null);
        }

        Post savedPost = postRepository.save(post);
        log.info("User '{}' updated post with ID: {}", post.getUser().getUsername(), savedPost.getPostId());
        return postMapper.toDTO(savedPost);
    }

    private void updatePostMedia(Post post, List<MediaUploadRequestDTO> mediaDtos) {
        if (mediaDtos == null) return;

        Map<Long, PostMedia> existingMediaMap = post.getMedia().stream()
                .collect(Collectors.toMap(PostMedia::getMediaId, media -> media));

        Set<Long> incomingMediaIds = new HashSet<>();
        List<PostMedia> finalMediaList = new ArrayList<>();

        for (MediaUploadRequestDTO dto : mediaDtos) {
            if (dto.getMediaId() == null) {
                String publicId = imageStorageService.extractPublicIdFromUrl(dto.getUrl());
                MediaAssetTracker tracker = mediaAssetTrackerRepository.findByPublicId(publicId)
                        .orElseThrow(() -> new IllegalStatePostActionException("Media asset not tracked for public_id: " + publicId));

                if (tracker.getStatus() != MediaAssetStatus.PENDING) {
                    throw new IllegalStatePostActionException("Cannot associate a media asset that is not in PENDING state.");
                }

                PostMedia newMedia = postMapper.toPostMediaEntities(Collections.singletonList(dto)).get(0);
                finalMediaList.add(newMedia);

                tracker.setStatus(MediaAssetStatus.ASSOCIATED);
                tracker.setPost(post);
            } else {
                incomingMediaIds.add(dto.getMediaId());
                PostMedia existingMedia = existingMediaMap.get(dto.getMediaId());
                if (existingMedia != null) {
                    existingMedia.setPosition(dto.getPosition());
                    finalMediaList.add(existingMedia);
                }
            }
        }

        for (Map.Entry<Long, PostMedia> entry : existingMediaMap.entrySet()) {
            if (!incomingMediaIds.contains(entry.getKey())) {
                String publicId = imageStorageService.extractPublicIdFromUrl(entry.getValue().getMediaUrl());
                mediaAssetTrackerRepository.findByPublicId(publicId).ifPresent(tracker -> {
                    tracker.setStatus(MediaAssetStatus.UNLINKED);
                    tracker.setPost(null);
                });
            }
        }

        post.getMedia().clear();
        for(PostMedia media : finalMediaList) {
            post.addMedia(media);
        }
    }
}