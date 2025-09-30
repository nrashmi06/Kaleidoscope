package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.ml.config.RedisStreamConstants;
import com.kaleidoscope.backend.ml.dto.PostImageEventDTO;
import com.kaleidoscope.backend.ml.service.RedisStreamPublisher;
import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCreationResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostDetailResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.posts.exception.Posts.*;
import com.kaleidoscope.backend.posts.mapper.PostMapper;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.repository.specification.PostSpecification;
import com.kaleidoscope.backend.posts.service.PostService;
import com.kaleidoscope.backend.posts.service.PostViewService;
import com.kaleidoscope.backend.shared.dto.request.CreateUserTagRequestDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.shared.model.MediaAssetTracker;
import com.kaleidoscope.backend.shared.model.UserTag;
import com.kaleidoscope.backend.shared.repository.*;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.shared.service.UserTagService;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
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
    private final ReactionRepository reactionRepository;
    private final JwtUtils jwtUtils;
    private final MediaAssetTrackerRepository mediaAssetTrackerRepository;
    private final FollowRepository followRepository;
    private final UserTagService userTagService;
    private final UserTagRepository userTagRepository;
    private final RedisStreamPublisher redisStreamPublisher;
    private final PostViewService postViewService;

    @Override
    @Transactional
    public PostCreationResponseDTO createPost(PostCreateRequestDTO postCreateRequestDTO) {
        log.info("Starting post creation process for user request with {} categories and {} media items",
                 postCreateRequestDTO.getCategoryIds().size(),
                 postCreateRequestDTO.getMediaDetails() != null ? postCreateRequestDTO.getMediaDetails().size() : 0);

        Long userId = jwtUtils.getUserIdFromContext();
        log.debug("Fetched userId from JWT context: {}", userId);

        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            log.error("Authentication failure: User not found in database for authenticated ID: {}", userId);
            throw new IllegalStatePostActionException("Authenticated user not found for ID: " + userId);
        }
        log.info("Authenticated user validated: username={}, userId={}", currentUser.getUsername(), userId);

        // 1. Map the DTO to a Post entity
        log.debug("Mapping PostCreateRequestDTO to Post entity with title: '{}'", postCreateRequestDTO.getTitle());
        Post post = postMapper.toEntity(postCreateRequestDTO);
        post.setUser(currentUser);

        // 2. Set Location and Categories before the first save
        if (postCreateRequestDTO.getLocationId() != null) {
            log.debug("Resolving location for post: locationId={}", postCreateRequestDTO.getLocationId());
            Location location = locationRepository.findById(postCreateRequestDTO.getLocationId())
                    .orElseThrow(() -> {
                        log.error("Location resolution failed: locationId={} not found in database", postCreateRequestDTO.getLocationId());
                        return new PostLocationNotFoundException(postCreateRequestDTO.getLocationId());
                    });
            post.setLocation(location);
            log.info("Location successfully associated with post: locationId={}", location.getLocationId());
        } else {
            log.debug("No location specified for post creation");
        }

        log.debug("Validating and fetching categories: categoryIds={}", postCreateRequestDTO.getCategoryIds());
        Set<Category> categories = new HashSet<>(categoryRepository.findAllById(postCreateRequestDTO.getCategoryIds()));
        if (categories.size() != postCreateRequestDTO.getCategoryIds().size()) {
            log.error("Category validation failed: requested={}, found={}, missingCategories={}",
                     postCreateRequestDTO.getCategoryIds().size(),
                     categories.size(),
                     postCreateRequestDTO.getCategoryIds().stream()
                             .filter(id -> categories.stream().noneMatch(cat -> cat.getCategoryId().equals(id)))
                             .collect(Collectors.toList()));
            throw new PostCategoryNotFoundException();
        }
        categories.forEach(post::addCategory);
        log.info("Successfully validated and associated {} categories with post", categories.size());

        log.debug("Persisting post entity to database");
        Post savedPost = postRepository.save(post);
        log.info("Post entity successfully saved: postId={}, title='{}'", savedPost.getPostId(), savedPost.getTitle());

        // 4. Now that savedPost.getPostId() is not null, process the media
        if (postCreateRequestDTO.getMediaDetails() != null && !postCreateRequestDTO.getMediaDetails().isEmpty()) {
            log.info("Processing {} media items for post", postCreateRequestDTO.getMediaDetails().size());
            List<PostMedia> mediaItems = postMapper.toPostMediaEntities(postCreateRequestDTO.getMediaDetails());

            for (PostMedia mediaItem : mediaItems) {
                log.debug("Validating media URL: {}", mediaItem.getMediaUrl());
                if (!imageStorageService.validatePostImageUrl(mediaItem.getMediaUrl())) {
                    log.error("Media validation failed: invalid or untrusted URL={}", mediaItem.getMediaUrl());
                    throw new IllegalArgumentException("Invalid or untrusted media URL: " + mediaItem.getMediaUrl());
                }

                String publicId = imageStorageService.extractPublicIdFromUrl(mediaItem.getMediaUrl());
                log.debug("Extracted publicId from media URL: publicId={}", publicId);

                MediaAssetTracker tracker = mediaAssetTrackerRepository.findByPublicId(publicId)
                        .orElseThrow(() -> {
                            log.error("Media asset tracking failed: publicId={} not found in tracker database", publicId);
                            return new IllegalStatePostActionException("Media asset not tracked for public_id: " + publicId);
                        });

                if (tracker.getStatus() != MediaAssetStatus.PENDING) {
                    log.error("Media asset state validation failed: expected=PENDING, actual={}, publicId={}",
                             tracker.getStatus(), publicId);
                    throw new IllegalStatePostActionException("Media asset must be in PENDING state to be associated. Current state: " + tracker.getStatus());
                }

                log.debug("Associating media with post: publicId={}, mediaType={}", publicId, mediaItem.getMediaType());
                savedPost.addMedia(mediaItem);

                tracker.setStatus(MediaAssetStatus.ASSOCIATED);
                tracker.setContentType(ContentType.POST.name());
                tracker.setContentId(savedPost.getPostId());
                log.info("Media asset successfully associated: publicId={}, postId={}", publicId, savedPost.getPostId());
            }

            log.debug("Persisting post with associated media to database");
            postRepository.save(savedPost);
            log.info("Post with {} media items successfully saved", mediaItems.size());

            // Iterate through the saved media and publish an event for each one
            log.info("Publishing {} post image events to Redis Stream for post {}", savedPost.getMedia().size(), savedPost.getPostId());
            savedPost.getMedia().forEach(mediaItem -> {
                PostImageEventDTO event = PostImageEventDTO.builder()
                    .postId(savedPost.getPostId())
                    .mediaId(mediaItem.getMediaId())
                    .imageUrl(mediaItem.getMediaUrl())
                    .correlationId(MDC.get("correlationId"))
                    .build();
                redisStreamPublisher.publish(RedisStreamConstants.POST_IMAGE_PROCESSING_STREAM, event);
            });
        } else {
            log.debug("No media items to process for this post");
        }

        // 5. Logic for user tagging can now use the generated postId
        if (postCreateRequestDTO.getTaggedUserIds() != null && !postCreateRequestDTO.getTaggedUserIds().isEmpty()) {
            log.info("Processing user tags: {} users to be tagged in post", postCreateRequestDTO.getTaggedUserIds().size());

            for (Long taggedUserId : postCreateRequestDTO.getTaggedUserIds()) {
                try {
                    CreateUserTagRequestDTO tagRequest = new CreateUserTagRequestDTO();
                    tagRequest.setTaggedUserId(taggedUserId);
                    tagRequest.setContentId(savedPost.getPostId());
                    tagRequest.setContentType(ContentType.POST);

                    log.debug("Creating user tag: taggedUserId={}, postId={}", taggedUserId, savedPost.getPostId());
                    userTagService.createUserTag(tagRequest);
                    log.info("User tag successfully created: taggedUserId={}, postId={}", taggedUserId, savedPost.getPostId());

                } catch (Exception e) {
                    log.warn("User tag creation failed for taggedUserId={}, postId={}, error={}",
                            taggedUserId, savedPost.getPostId(), e.getMessage());
                    // Continue processing other tags even if one fails
                }
            }
        } else {
            log.debug("No user tags to process for this post");
        }

        log.info("Post creation completed successfully: postId={}, userId={}, username='{}', title='{}'",
                savedPost.getPostId(), userId, currentUser.getUsername(), savedPost.getTitle());
        return postMapper.toDTO(savedPost);
    }

    @Override
    @Transactional
    public PostCreationResponseDTO updatePost(Long postId, PostUpdateRequestDTO requestDTO) {
        log.info("Starting update for postId: {}", postId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> {
                    log.error("Post not found for update: {}", postId);
                    return new PostNotFoundException(postId);
                });

        Long currentUserId = jwtUtils.getUserIdFromContext();
        if (!post.getUser().getUserId().equals(currentUserId)) {
            log.error("User {} not authorized to edit post {}", currentUserId, postId);
            throw new UnauthorizedActionException("User is not authorized to edit this post.");
        }

        log.debug("Updating post fields");
        post.setTitle(requestDTO.getTitle());
        post.setBody(requestDTO.getBody());
        post.setSummary(requestDTO.getSummary());
        post.setVisibility(requestDTO.getVisibility());

        log.debug("Updating post media");
        updatePostMedia(post, requestDTO.getMediaDetails());
        log.debug("Updating post tags");
        updatePostTags(post, requestDTO.getTaggedUserIds());

        if (requestDTO.getCategoryIds() != null) {
            log.debug("Updating post categories: {}", requestDTO.getCategoryIds());
            Set<Category> categories = new HashSet<>(categoryRepository.findAllById(requestDTO.getCategoryIds()));
            if (categories.size() != requestDTO.getCategoryIds().size()) {
                log.error("Some categories not found for IDs: {}", requestDTO.getCategoryIds());
                throw new PostCategoryNotFoundException();
            }
            post.getCategories().clear();
            categories.forEach(post::addCategory);
        }

        if (requestDTO.getLocationId() != null) {
            log.debug("Updating post location: {}", requestDTO.getLocationId());
            Location location = locationRepository.findById(requestDTO.getLocationId())
                    .orElseThrow(() -> {
                        log.error("Location not found: {}", requestDTO.getLocationId());
                        return new PostLocationNotFoundException(requestDTO.getLocationId());
                    });
            post.setLocation(location);
        } else {
            log.debug("Clearing post location");
            post.setLocation(null);
        }

        Post savedPost = postRepository.save(post);
        log.info("User '{}' updated post with ID: {}", post.getUser().getUsername(), savedPost.getPostId());

        // Publish update event to Redis Stream for post updates - only if there are images
        if (!savedPost.getMedia().isEmpty()) {
            // Get the first media item with its ID and URL
            PostMedia firstMedia = savedPost.getMedia().stream().findFirst().orElse(null);
            if (firstMedia != null && firstMedia.getMediaUrl() != null) {
                log.info("Publishing post update event to Redis Stream for post {} with media ID {}",
                        savedPost.getPostId(), firstMedia.getMediaId());
                PostImageEventDTO event = PostImageEventDTO.builder()
                        .postId(savedPost.getPostId())
                        .mediaId(firstMedia.getMediaId()) // Include media ID for tracking ML insights
                        .imageUrl(firstMedia.getMediaUrl())
                        .correlationId(MDC.get("correlationId"))
                        .build();
                redisStreamPublisher.publish(RedisStreamConstants.POST_UPDATE_STREAM, event);
            }
        } else {
            log.debug("Skipping Redis Stream publishing for post update {} - no media present", savedPost.getPostId());
        }

        return postMapper.toDTO(savedPost);
    }

    private void updatePostTags(Post post, Set<Long> incomingTaggedUserIds) {
        log.debug("Updating tags for postId: {}", post.getPostId());
        Set<Long> incomingIds = (incomingTaggedUserIds != null) ? incomingTaggedUserIds : Collections.emptySet();

        List<UserTag> existingTags = userTagRepository.findByContentTypeAndContentId(ContentType.POST, post.getPostId(), Pageable.unpaged()).getContent();
        Map<Long, UserTag> existingTagsMap = existingTags.stream()
                .collect(Collectors.toMap(tag -> tag.getTaggedUser().getUserId(), tag -> tag));

        List<UserTag> tagsToRemove = existingTags.stream()
                .filter(tag -> !incomingIds.contains(tag.getTaggedUser().getUserId()))
                .collect(Collectors.toList());

        if (!tagsToRemove.isEmpty()) {
            log.debug("Removing {} tags from post ID: {}", tagsToRemove.size(), post.getPostId());
            userTagRepository.deleteAll(tagsToRemove);
        }

        for (Long incomingId : incomingIds) {
            if (!existingTagsMap.containsKey(incomingId)) {
                log.debug("Adding new tag for userId: {}", incomingId);
                CreateUserTagRequestDTO tagRequest = CreateUserTagRequestDTO.builder()
                        .taggedUserId(incomingId)
                        .contentId(post.getPostId())
                        .contentType(ContentType.POST)
                        .build();
                userTagService.createUserTag(tagRequest);
            }
        }
    }

    private void updatePostMedia(Post post, List<MediaUploadRequestDTO> mediaDtos) {
        log.debug("Updating media for postId: {}", post.getPostId());
        if (mediaDtos == null) return;

        Map<Long, PostMedia> existingMediaMap = post.getMedia().stream()
                .collect(Collectors.toMap(PostMedia::getMediaId, media -> media));

        Set<Long> incomingMediaIds = new HashSet<>();
        List<PostMedia> finalMediaList = new ArrayList<>();
        List<PostMedia> newMediaItems = new ArrayList<>();

        for (MediaUploadRequestDTO dto : mediaDtos) {
            if (dto.getMediaId() == null) {
                log.debug("Adding new media from URL: {}", dto.getUrl());
                String publicId = imageStorageService.extractPublicIdFromUrl(dto.getUrl());
                MediaAssetTracker tracker = mediaAssetTrackerRepository.findByPublicId(publicId)
                        .orElseThrow(() -> {
                            log.error("Media asset not tracked for public_id: {}", publicId);
                            return new IllegalStatePostActionException("Media asset not tracked for public_id: " + publicId);
                        });

                if (tracker.getStatus() != MediaAssetStatus.PENDING) {
                    log.error("Cannot associate a media asset that is not in PENDING state. Status: {}", tracker.getStatus());
                    throw new IllegalStatePostActionException("Cannot associate a media asset that is not in PENDING state.");
                }

                PostMedia newMedia = postMapper.toPostMediaEntities(Collections.singletonList(dto)).get(0);
                finalMediaList.add(newMedia);
                newMediaItems.add(newMedia);

                tracker.setStatus(MediaAssetStatus.ASSOCIATED);
                tracker.setContentType(ContentType.POST.name());
                tracker.setContentId(post.getPostId());
                log.debug("Associated new media with post");
            } else {
                incomingMediaIds.add(dto.getMediaId());
                PostMedia existingMedia = existingMediaMap.get(dto.getMediaId());
                if (existingMedia != null) {
                    log.debug("Updating position for existing mediaId: {}", dto.getMediaId());
                    existingMedia.setPosition(dto.getPosition());
                    finalMediaList.add(existingMedia);
                }
            }
        }

        for (Map.Entry<Long, PostMedia> entry : existingMediaMap.entrySet()) {
            if (!incomingMediaIds.contains(entry.getKey())) {
                log.debug("Marking media for delete: {}", entry.getValue().getMediaUrl());
                String publicId = imageStorageService.extractPublicIdFromUrl(entry.getValue().getMediaUrl());
                mediaAssetTrackerRepository.findByPublicId(publicId).ifPresent(tracker -> {
                    tracker.setStatus(MediaAssetStatus.MARKED_FOR_DELETE);
                    tracker.setContentType(ContentType.POST.name());
                    tracker.setContentId(post.getPostId());
                });
            }
        }

        post.getMedia().clear();
        for(PostMedia media : finalMediaList) {
            post.addMedia(media);
        }

        // Publish Redis Stream events for newly added media during update
        if (!newMediaItems.isEmpty()) {
            log.info("Publishing {} new media events to Redis Stream for post update {}", newMediaItems.size(), post.getPostId());
            newMediaItems.forEach(mediaItem -> {
                PostImageEventDTO event = PostImageEventDTO.builder()
                    .postId(post.getPostId())
                    .mediaId(mediaItem.getMediaId())
                    .imageUrl(mediaItem.getMediaUrl())
                    .correlationId(MDC.get("correlationId"))
                    .build();
                redisStreamPublisher.publish(RedisStreamConstants.POST_IMAGE_PROCESSING_STREAM, event);
            });
        }
    }

    @Override
    @Transactional
    public void softDeletePost(Long postId) {
        log.info("Soft deleting postId: {}", postId);
        Post post = postRepository.findById(postId).orElseThrow(() -> {
            log.error("Post not found for soft delete: {}", postId);
            return new PostNotFoundException(postId);
        });
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        if (!isAdmin && !post.getUser().getUserId().equals(currentUserId)) {
            log.error("User {} not authorized to delete post {}", currentUserId, postId);
            throw new UnauthorizedActionException("User is not authorized to delete this post.");
        }

        List<UserTag> tagsToDelete = userTagRepository.findByContentTypeAndContentId(ContentType.POST, postId, Pageable.unpaged()).getContent();
        if (!tagsToDelete.isEmpty()) {
            log.debug("Soft deleting {} associated user tags for post ID: {}", tagsToDelete.size(), postId);
            userTagRepository.deleteAll(tagsToDelete);
        }

        postRepository.delete(post);
        log.info("Post {} soft-deleted by user {} (admin? {})", postId, currentUserId, isAdmin);
    }

    @Override
    @Transactional
    public void hardDeletePost(Long postId) {
        log.info("Hard deleting postId: {}", postId);
        Post post = postRepository.findById(postId).orElseThrow(() -> {
            log.error("Post not found for hard delete: {}", postId);
            return new PostNotFoundException(postId);
        });

        List<UserTag> tagsToDelete = userTagRepository.findByContentTypeAndContentId(ContentType.POST, postId, Pageable.unpaged()).getContent();
        if (!tagsToDelete.isEmpty()) {
            log.debug("Hard deleting {} associated user tags for post ID: {}", tagsToDelete.size(), postId);
            userTagRepository.deleteAll(tagsToDelete);
        }

        for (PostMedia media : post.getMedia()) {
            log.debug("Unlinking and deleting media: {}", media.getMediaUrl());
            String publicId = imageStorageService.extractPublicIdFromUrl(media.getMediaUrl());
            mediaAssetTrackerRepository.findByPublicId(publicId).ifPresent(tracker -> {
                tracker.setStatus(MediaAssetStatus.UNLINKED);
                tracker.setContentType(ContentType.POST.name());
                tracker.setContentId(post.getPostId());
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
    public PostDetailResponseDTO getPostById(Long postId) {
        log.info("Fetching post details for postId: {}", postId);
        Post post = postRepository.findById(postId).orElseThrow(() -> {
            log.error("Post not found: {}", postId);
            return new PostNotFoundException(postId);
        });

        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        boolean isOwner = post.getUser().getUserId().equals(currentUserId);

        // Access control validation
        if (!isAdmin && !isOwner) {
            // Non-admin, non-owner users can only see PUBLISHED posts
            if (post.getStatus() != PostStatus.PUBLISHED) {
                log.error("Access denied: User {} cannot view unpublished post {}", currentUserId, postId);
                throw new UnauthorizedActionException("Not allowed to view this post");
            }

            // For FOLLOWERS visibility, check if current user follows the author
            if (post.getVisibility() == PostVisibility.FOLLOWERS) {
                boolean isFollowing = followRepository.existsByFollower_UserIdAndFollowing_UserId(
                    currentUserId, post.getUser().getUserId());
                if (!isFollowing) {
                    log.error("Access denied: User {} is not following author {} for FOLLOWERS post {}",
                            currentUserId, post.getUser().getUserId(), postId);
                    throw new UnauthorizedActionException("Not allowed to view this post");
                }
            }
        }

        // Track view count using Redis optimization (only for non-owners)
        if (!isOwner) {
            postViewService.incrementViewAsync(postId, currentUserId);
            log.debug("View tracking initiated for post {} by user {}", postId, currentUserId);
        }

        com.kaleidoscope.backend.shared.enums.ReactionType currentUserReaction = null;
        var reactionOpt = reactionRepository.findByContentAndUser(postId, ContentType.POST, currentUserId);
        if (reactionOpt.isPresent()) {
            currentUserReaction = reactionOpt.get().getReactionType();
        }
        log.debug("Returning post detail DTO for postId: {}", postId);
        return postMapper.toPostDetailDTO(post, currentUserReaction);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<PostSummaryResponseDTO> filterPosts(Pageable pageable,
                                                                 Long userId,
                                                                 Long categoryId,
                                                                 PostStatus status,
                                                                 PostVisibility visibility,
                                                                 String query) {
        log.info("Filtering posts with params: userId={}, categoryId={}, status={}, visibility={}, query={}",
                userId, categoryId, status, visibility, query);
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();

        Specification<Post> spec = Specification.where(null);
        spec = spec.and(PostSpecification.hasAuthor(userId));
        spec = spec.and(PostSpecification.hasCategory(categoryId));
        spec = spec.and(PostSpecification.hasStatus(status));
        spec = spec.and(PostSpecification.hasVisibility(visibility));
        spec = spec.and(PostSpecification.containsQuery(query));

        if (!isAdmin) {
            log.debug("Applying visibility rules for non-admin user: {}", currentUserId);
            Set<Long> followingIds = followRepository.findFollowingIdsByFollowerId(currentUserId);
            spec = spec.and(PostSpecification.isVisibleToUser(currentUserId, followingIds));
        }

        Page<Post> postPage = postRepository.findAll(spec, pageable);
        Page<PostSummaryResponseDTO> dtoPage = postPage.map(postMapper::toPostSummaryDTO);
        log.debug("Returning paginated response for filtered posts");
        return PaginatedResponse.fromPage(dtoPage);
    }
}

