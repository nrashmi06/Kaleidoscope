package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCreationResponseDTO;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.posts.exception.Posts.*;
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
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
    private final FollowRepository followRepository;

    @Override
    @Transactional
    public PostCreationResponseDTO createPost(PostCreateRequestDTO postCreateRequestDTO) {
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
    public PostCreationResponseDTO updatePost(Long postId, PostUpdateRequestDTO requestDTO) {
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
                    tracker.setStatus(MediaAssetStatus.MARKED_FOR_DELETE);
                    tracker.setPost(null);
                });
            }
        }

        post.getMedia().clear();
        for(PostMedia media : finalMediaList) {
            post.addMedia(media);
        }
    }

    @Override
    @Transactional
    public void softDeletePost(Long postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        if (!isAdmin && !post.getUser().getUserId().equals(currentUserId)) {
            throw new UnauthorizedActionException("User is not authorized to delete this post.");
        }
        postRepository.delete(post);
        log.info("Post {} soft-deleted by user {} (admin? {})", postId, currentUserId, isAdmin);
    }

    @Override
    @Transactional
    public void hardDeletePost(Long postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));

        for (PostMedia media : post.getMedia()) {
            String publicId = imageStorageService.extractPublicIdFromUrl(media.getMediaUrl());
            mediaAssetTrackerRepository.findByPublicId(publicId).ifPresent(tracker -> {
                tracker.setStatus(MediaAssetStatus.UNLINKED);
                tracker.setPost(null);
            });
            imageStorageService.deleteImageByPublicId(imageStorageService.extractPublicIdFromUrl(media.getMediaUrl()));
        }

        post.getMedia().clear();
        post.getCategories().clear();
        postRepository.hardDeleteById(post.getPostId());
        log.info("Post {} hard-deleted by admin", postId);
    }

    @Override
    @Transactional(readOnly = true)
    public PostCreationResponseDTO getPostById(Long postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        boolean isOwner = post.getUser().getUserId().equals(currentUserId);
        if (!isAdmin && !isOwner) {
            if (post.getStatus() != PostStatus.PUBLISHED) {
                throw new UnauthorizedActionException("Not allowed to view this post");
            }
            if (post.getVisibility() == PostVisibility.FOLLOWERS) {
                // This logic might need adjustment based on whether the current user follows the post owner
                throw new UnauthorizedActionException("Not allowed to view this post");
            }
        }
        return postMapper.toDTO(post);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<PostCreationResponseDTO> filterPosts(Pageable pageable,
                                                                  Long userId,
                                                                  Long categoryId,
                                                                  PostStatus status,
                                                                  PostVisibility visibility,
                                                                  String query) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        Specification<Post> spec = Specification.where(null);

        if (userId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("user").get("userId"), userId));
        }
        if (categoryId != null) {
            spec = spec.and((root, q, cb) -> {
                var join = root.join("categories").get("category");
                return cb.equal(join.get("categoryId"), categoryId);
            });
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (visibility != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("visibility"), visibility));
        }
        if (query != null && !query.isBlank()) {
            String likePattern = "%" + query.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), likePattern),
                    cb.like(cb.lower(root.get("summary")), likePattern),
                    cb.like(cb.lower(root.get("body")), likePattern)
            ));
        }
        if (!isAdmin) {
            Set<Long> followingIds = followRepository.findFollowingIdsByFollowerId(currentUserId);

            Specification<Post> visibilitySpec = (root, q, cb) -> cb.or(
                    cb.and(
                            cb.equal(root.get("status"), PostStatus.PUBLISHED),
                            cb.equal(root.get("visibility"), PostVisibility.PUBLIC)
                    ),
                    cb.equal(root.get("user").get("userId"), currentUserId),
                    cb.and(
                            cb.equal(root.get("visibility"), PostVisibility.FOLLOWERS),
                            root.get("user").get("userId").in(followingIds)
                    )
            );
            spec = spec.and(visibilitySpec);
        }

        Page<Post> postPage = postRepository.findAll(spec, pageable);
        Page<PostCreationResponseDTO> dtoPage = postPage.map(postMapper::toDTO);
        return PaginatedResponse.fromPage(dtoPage);
    }
}