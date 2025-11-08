package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.async.dto.PostImageEventDTO;
import com.kaleidoscope.backend.async.service.RedisStreamPublisher;
import com.kaleidoscope.backend.async.streaming.ProducerStreamConstants;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.document.PostDocument;
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
import com.kaleidoscope.backend.posts.repository.search.PostSearchRepository;
import com.kaleidoscope.backend.posts.service.PostService;
import com.kaleidoscope.backend.posts.service.PostViewService;
import com.kaleidoscope.backend.shared.dto.request.CreateUserTagRequestDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
import com.kaleidoscope.backend.shared.exception.categoryException.CategoryNotFoundException;
import com.kaleidoscope.backend.shared.exception.locationException.LocationNotFoundException;
import com.kaleidoscope.backend.shared.model.*;
import com.kaleidoscope.backend.shared.repository.*;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.service.HashtagService;
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
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.TimeUnit;
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
    private final PostSearchRepository postSearchRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final HashtagService hashtagService;

    @Override
    @Transactional
    public PostCreationResponseDTO createPost(PostCreateRequestDTO postCreateRequestDTO) {
        log.info("Starting post creation process for user request with {} categories and {} media items",
                 postCreateRequestDTO.categoryIds().size(),
                 postCreateRequestDTO.mediaDetails() != null ? postCreateRequestDTO.mediaDetails().size() : 0);

        Long userId = jwtUtils.getUserIdFromContext();
        log.debug("Fetched userId from JWT context: {}", userId);

        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            log.error("Authentication failure: User not found in database for authenticated ID: {}", userId);
            throw new IllegalStatePostActionException("Authenticated user not found for ID: " + userId);
        }
        log.info("Authenticated user validated: username={}, userId={}", currentUser.getUsername(), userId);

        // 1. Map the DTO to a Post entity
        log.debug("Mapping PostCreateRequestDTO to Post entity with title: '{}'", postCreateRequestDTO.title());
        Post post = postMapper.toEntity(postCreateRequestDTO);
        post.setUser(currentUser);

        log.info("Post creation initiated by user '{}' with title: '{}'", currentUser.getUsername(), postCreateRequestDTO.title());

        // Handle location if provided
        if (postCreateRequestDTO.locationId() != null) {
            Location location = locationRepository.findById(postCreateRequestDTO.locationId())
                    .orElseThrow(() -> new LocationNotFoundException("Location not found with ID: " + postCreateRequestDTO.locationId()));
            post.setLocation(location);
            log.debug("Location associated with post: locationId={}, name={}", postCreateRequestDTO.locationId(), location.getName());
        }

        // Validate and process categories
        Set<Category> categories = new HashSet<>(categoryRepository.findAllById(postCreateRequestDTO.categoryIds()));
        if (categories.size() != postCreateRequestDTO.categoryIds().size()) {
            Set<Long> foundCategoryIds = categories.stream()
                    .map(Category::getCategoryId)
                    .collect(Collectors.toSet());
            Set<Long> missingCategoryIds = postCreateRequestDTO.categoryIds().stream()
                    .filter(id -> !foundCategoryIds.contains(id))
                    .collect(Collectors.toSet());
            log.error("Category validation failed: requested={}, found={}, missing={}",
                      postCreateRequestDTO.categoryIds(), foundCategoryIds, missingCategoryIds);
            throw new CategoryNotFoundException("Categories not found with IDs: " + missingCategoryIds);
        }

        categories.forEach(post::addCategory);

        // Save the post first to generate its ID
        Post savedPost = postRepository.save(post);
        log.info("Post entity successfully saved: postId={}, title='{}'", savedPost.getPostId(), savedPost.getTitle());

        // Handle hashtags: parse, find/create, and associate with post
        log.debug("Processing hashtags for post body");
        Set<String> hashtagNames = hashtagService.parseHashtags(postCreateRequestDTO.body());
        if (!hashtagNames.isEmpty()) {
            log.info("Found {} hashtags in post body", hashtagNames.size());
            List<Hashtag> hashtags = hashtagService.findOrCreateHashtags(hashtagNames);
            hashtagService.associateHashtagsWithPost(savedPost, new HashSet<>(hashtags));
            hashtagService.triggerHashtagUsageUpdate(new HashSet<>(hashtags), Collections.emptySet());
            log.info("Successfully associated and updated usage for {} hashtags", hashtags.size());
        } else {
            log.debug("No hashtags found in post body");
        }

        // Handle media if provided
        if (postCreateRequestDTO.mediaDetails() != null && !postCreateRequestDTO.mediaDetails().isEmpty()) {
            log.debug("Processing {} media items for post", postCreateRequestDTO.mediaDetails().size());
            List<PostMedia> postMediaList = postMapper.toPostMediaEntities(postCreateRequestDTO.mediaDetails());

            for (PostMedia mediaItem : postMediaList) {
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

            // Save again to persist the new media relationships
            final Post finalSavedPost = postRepository.save(savedPost);
            log.debug("Persisting post with associated media to database");

            // Iterate through the saved media and publish an event for each one
            log.info("Publishing {} post image events to Redis Stream for post {}", finalSavedPost.getMedia().size(), finalSavedPost.getPostId());

            // Get the current user ID for the uploaderId field
            Long uploaderId = currentUser.getUserId();

            finalSavedPost.getMedia().forEach(mediaItem -> {
                PostImageEventDTO event = PostImageEventDTO.builder()
                    .postId(finalSavedPost.getPostId())
                    .mediaId(mediaItem.getMediaId())
                    .mediaUrl(mediaItem.getMediaUrl()) // RENAMED
                    .uploaderId(uploaderId) // ADDED
                    .timestamp(java.time.Instant.now().toString()) // ADDED
                    .correlationId(MDC.get("correlationId")) // KEPT
                    .build();
                redisStreamPublisher.publish(ProducerStreamConstants.POST_IMAGE_PROCESSING_STREAM, event);
            });

            savedPost = finalSavedPost;
        } else {
            log.debug("No media items to process for this post");
        }

        // Handle user tagging if provided
        if (postCreateRequestDTO.taggedUserIds() != null && !postCreateRequestDTO.taggedUserIds().isEmpty()) {
            log.debug("Processing {} user tags for post", postCreateRequestDTO.taggedUserIds().size());

            for (Long taggedUserId : postCreateRequestDTO.taggedUserIds()) {
                try {
                    CreateUserTagRequestDTO tagRequest = new CreateUserTagRequestDTO(taggedUserId, ContentType.POST, savedPost.getPostId());
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

        // 6. Index the new post to Elasticsearch with initial/default denormalized values
        try {
            // Use mapper to create PostDocument from Post entity
            PostDocument postDocument = postMapper.toPostDocument(savedPost);

            // Log location info if present
            if (postDocument.getLocation() != null) {
                log.debug("Including location in ES index for post {}: locationId={}, name={}, hasCoordinates={}",
                         savedPost.getPostId(), postDocument.getLocation().getId(),
                         postDocument.getLocation().getName(), postDocument.getLocation().getPoint() != null);
            }

            // Index to Elasticsearch
            postSearchRepository.save(postDocument);
            log.info("Successfully indexed new post {} to Elasticsearch", savedPost.getPostId());

        } catch (Exception e) {
            log.error("Failed to index post {} to Elasticsearch: {}", savedPost.getPostId(), e.getMessage(), e);
            // Continue execution - don't fail post creation if ES indexing fails
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
        post.setTitle(requestDTO.title());
        post.setBody(requestDTO.body());
        post.setSummary(requestDTO.summary());
        post.setVisibility(requestDTO.visibility());

        log.debug("Updating post media");
        updatePostMedia(post, requestDTO.mediaDetails());
        log.debug("Updating post tags");
        updatePostTags(post, requestDTO.taggedUserIds());

        if (requestDTO.categoryIds() != null) {
            log.debug("Updating post categories: {}", requestDTO.categoryIds());
            Set<Category> categories = new HashSet<>(categoryRepository.findAllById(requestDTO.categoryIds()));
            if (categories.size() != requestDTO.categoryIds().size()) {
                log.error("Some categories not found for IDs: {}", requestDTO.categoryIds());
                throw new PostCategoryNotFoundException();
            }
            post.getCategories().clear();
            categories.forEach(post::addCategory);
        }

        if (requestDTO.locationId() != null) {
            log.debug("Updating post location: {}", requestDTO.locationId());
            Location location = locationRepository.findById(requestDTO.locationId())
                    .orElseThrow(() -> {
                        log.error("Location not found: {}", requestDTO.locationId());
                        return new PostLocationNotFoundException(requestDTO.locationId());
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
                        .mediaUrl(firstMedia.getMediaUrl()) // RENAMED
                        .uploaderId(currentUserId) // ADDED
                        .timestamp(java.time.Instant.now().toString()) // ADDED
                        .correlationId(MDC.get("correlationId")) // KEPT
                        .build();
                redisStreamPublisher.publish(ProducerStreamConstants.POST_UPDATE_STREAM, event);
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
                CreateUserTagRequestDTO tagRequest = new CreateUserTagRequestDTO(incomingId, ContentType.POST, post.getPostId());
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
            if (dto.mediaId() == null) {
                log.debug("Adding new media from URL: {}", dto.url());
                String publicId = imageStorageService.extractPublicIdFromUrl(dto.url());
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
                incomingMediaIds.add(dto.mediaId());
                PostMedia existingMedia = existingMediaMap.get(dto.mediaId());
                if (existingMedia != null) {
                    log.debug("Updating position for existing mediaId: {}", dto.mediaId());
                    existingMedia.setPosition(dto.position());
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

            // Get the current user ID for the uploaderId field
            Long uploaderId = jwtUtils.getUserIdFromContext();

            newMediaItems.forEach(mediaItem -> {
                PostImageEventDTO event = PostImageEventDTO.builder()
                    .postId(post.getPostId())
                    .mediaId(mediaItem.getMediaId())
                    .mediaUrl(mediaItem.getMediaUrl()) // RENAMED
                    .uploaderId(uploaderId) // ADDED
                    .timestamp(java.time.Instant.now().toString()) // ADDED
                    .correlationId(MDC.get("correlationId")) // KEPT
                    .build();
                redisStreamPublisher.publish(ProducerStreamConstants.POST_IMAGE_PROCESSING_STREAM, event);
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

        // Before deleting, get associated hashtags and trigger usage count decrement
        log.debug("Retrieving hashtags for post {} before deletion", postId);
        Set<Hashtag> hashtags = post.getHashtags();
        if (!hashtags.isEmpty()) {
            log.info("Triggering usage count decrement for {} hashtags", hashtags.size());
            hashtagService.triggerHashtagUsageUpdate(Collections.emptySet(), hashtags);
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

        // Before deleting, get associated hashtags and trigger usage count decrement
        log.debug("Retrieving hashtags for post {} before hard deletion", postId);
        Set<Hashtag> hashtags = post.getHashtags();
        if (!hashtags.isEmpty()) {
            log.info("Triggering usage count decrement for {} hashtags", hashtags.size());
            hashtagService.triggerHashtagUsageUpdate(Collections.emptySet(), hashtags);
        }

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

            // Track this post as viewed for suggestions filtering
            trackPostViewAsync(currentUserId, postId);
        }

        com.kaleidoscope.backend.shared.enums.ReactionType currentUserReaction = null;
        var reactionOpt = reactionRepository.findByContentAndUser(postId, ContentType.POST, currentUserId);
        if (reactionOpt.isPresent()) {
            currentUserReaction = reactionOpt.get().getReactionType();
        }
        log.debug("Returning post detail DTO for postId: {}", postId);
        return postMapper.toPostDetailDTO(post, currentUserReaction);
    }

    /**
     * Asynchronously track a post view for filtering in suggestions
     * Stores the viewed post ID in a Redis Set with 7-day expiry
     *
     * @param userId The ID of the user who viewed the post
     * @param postId The ID of the post that was viewed
     */
    @org.springframework.scheduling.annotation.Async("taskExecutor")
    public void trackPostViewAsync(Long userId, Long postId) {
        try {
            String viewedKey = "viewed_posts:" + userId;
            stringRedisTemplate.opsForSet().add(viewedKey, postId.toString());
            stringRedisTemplate.expire(viewedKey, 7, TimeUnit.DAYS);
            log.debug("Tracked viewed post {} for user {} in Redis with 7-day expiry", postId, userId);
        } catch (Exception e) {
            log.error("Failed to track viewed post {} for user {} in Redis: {}", postId, userId, e.getMessage());
            // Don't throw - this is a non-critical feature
        }
    }


    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<PostSummaryResponseDTO> filterPosts(Pageable pageable,
                                                                 Long userId,
                                                                 Long categoryId,
                                                                 PostStatus status,
                                                                 PostVisibility visibility,
                                                                 String query,
                                                                 String hashtag,
                                                                 Long locationId,
                                                                 Long nearbyLocationId,
                                                                 Double radiusKm) {
        log.info("Filtering posts with Elasticsearch: userId={}, categoryId={}, status={}, visibility={}, query={}, hashtag={}, locationId={}, nearbyLocationId={}, radiusKm={}",
                userId, categoryId, status, visibility, query, hashtag, locationId, nearbyLocationId, radiusKm);

        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();

        // For non-admin users, get following IDs for visibility rules
        Set<Long> followingIds = null;
        if (!isAdmin && currentUserId != null) {
            followingIds = followRepository.findFollowingIdsByFollowerId(currentUserId);
            log.debug("Retrieved {} following IDs for user {}", followingIds.size(), currentUserId);
        }

        // Handle nearbyLocationId - fetch coordinates for geo-distance query
        Double latitude = null;
        Double longitude = null;
        if (nearbyLocationId != null) {
            log.debug("Fetching coordinates for nearbyLocationId: {}", nearbyLocationId);
            Location location = locationRepository.findById(nearbyLocationId)
                    .orElseThrow(() -> new LocationNotFoundException("Location not found with ID: " + nearbyLocationId));

            if (location.getLatitude() != null && location.getLongitude() != null) {
                latitude = location.getLatitude().doubleValue();
                longitude = location.getLongitude().doubleValue();
                log.info("Using geo-distance query: center=({}, {}), radius={}km", latitude, longitude, radiusKm);
            } else {
                log.warn("Location {} exists but has no coordinates. Geo-distance query will be skipped.", nearbyLocationId);
            }
        }

        // Use the custom Elasticsearch repository method
        Page<PostDocument> documentPage = postSearchRepository.findVisibleAndFilteredPosts(
                currentUserId,
                followingIds,
                userId,
                categoryId,
                status,
                visibility,
                query,
                hashtag,
                locationId,
                latitude,
                longitude,
                radiusKm,
                pageable
        );

        // Map PostDocument to PostSummaryResponseDTO using the new overloaded mapper method
        Page<PostSummaryResponseDTO> dtoPage = documentPage.map(postMapper::toPostSummaryDTO);

        log.info("Elasticsearch query returned {} posts out of {} total",
                dtoPage.getNumberOfElements(), dtoPage.getTotalElements());

        return PaginatedResponse.fromPage(dtoPage);
    }
}
