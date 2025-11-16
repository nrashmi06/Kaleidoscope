package com.kaleidoscope.backend.blogs.service.impl;

import com.kaleidoscope.backend.async.dto.NotificationEventDTO;
import com.kaleidoscope.backend.async.service.RedisStreamPublisher;
import com.kaleidoscope.backend.async.streaming.ProducerStreamConstants;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.blogs.document.BlogDocument;
import com.kaleidoscope.backend.blogs.dto.request.BlogCreateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogStatusUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogCreationResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogDetailResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import com.kaleidoscope.backend.blogs.exception.Blogs.BlogNotFoundException;
import com.kaleidoscope.backend.blogs.exception.Blogs.UnauthorizedBlogActionException;
import com.kaleidoscope.backend.blogs.mapper.BlogMapper;
import com.kaleidoscope.backend.blogs.model.Blog;
import com.kaleidoscope.backend.blogs.model.BlogMedia;
import com.kaleidoscope.backend.blogs.repository.BlogRepository;
import com.kaleidoscope.backend.blogs.repository.search.BlogSearchRepository;
import com.kaleidoscope.backend.blogs.service.BlogService;
import com.kaleidoscope.backend.blogs.service.BlogViewService;
import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
import com.kaleidoscope.backend.shared.enums.NotificationType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.shared.exception.categoryException.CategoryNotFoundException;
import com.kaleidoscope.backend.shared.exception.locationException.LocationNotFoundException;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.shared.model.MediaAssetTracker;
import com.kaleidoscope.backend.shared.repository.*;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlogServiceImpl implements BlogService {

    private final BlogRepository blogRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final BlogMapper blogMapper;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final ImageStorageService imageStorageService;
    private final MediaAssetTrackerRepository mediaAssetTrackerRepository;
    private final BlogViewService blogViewService;
    private final BlogSearchRepository blogSearchRepository; // ES repository injected
    private final RedisStreamPublisher redisStreamPublisher;
    private final com.kaleidoscope.backend.blogs.repository.BlogTagRepository blogTagRepository;

    @Override
    @Transactional
    public BlogCreationResponseDTO createBlog(BlogCreateRequestDTO blogCreateRequestDTO) {
        Long userId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            throw new IllegalArgumentException("Authenticated user not found for ID: " + userId);
        }

        // Validate categories early and provide specific error message
        if (blogCreateRequestDTO.categoryIds() == null || blogCreateRequestDTO.categoryIds().isEmpty()) {
            throw new IllegalArgumentException("At least one category must be specified");
        }

        Set<Category> categories = new HashSet<>(categoryRepository.findAllById(blogCreateRequestDTO.categoryIds()));
        if (categories.size() != blogCreateRequestDTO.categoryIds().size()) {
            Set<Long> foundCategoryIds = categories.stream()
                    .map(Category::getCategoryId)
                    .collect(Collectors.toSet());
            Set<Long> missingCategoryIds = blogCreateRequestDTO.categoryIds().stream()
                    .filter(id -> !foundCategoryIds.contains(id))
                    .collect(Collectors.toSet());
            throw new CategoryNotFoundException("Categories not found with IDs: " + missingCategoryIds);
        }

        Blog blog = blogMapper.toEntity(blogCreateRequestDTO);
        blog.setUser(currentUser);
        blog.setBlogStatus(BlogStatus.APPROVAL_PENDING);

        // Handle location if provided
        if (blogCreateRequestDTO.locationId() != null) {
            Location location = locationRepository.findById(blogCreateRequestDTO.locationId())
                    .orElseThrow(() -> new LocationNotFoundException("Location not found with ID: " + blogCreateRequestDTO.locationId()));
            blog.setLocation(location);
        }

        // Save the blog first to generate its ID
        Blog savedBlog = blogRepository.save(blog);

        // Now add categories after the blog has an ID
        categories.forEach(savedBlog::addCategory);

        // Save again to persist the category relationships
        savedBlog = blogRepository.save(savedBlog);

        // Handle blog tags if provided
        List<Long> blogTagIds = blogCreateRequestDTO.blogTagIds();
        if (blogTagIds != null && !blogTagIds.isEmpty()) {
            List<Blog> taggedBlogs = blogRepository.findAllById(blogTagIds);
            List<com.kaleidoscope.backend.blogs.model.BlogTag> newTags = new ArrayList<>();

            for (Blog taggedBlog : taggedBlogs) {
                if (taggedBlog.getBlogId().equals(savedBlog.getBlogId())) {
                    continue; // Prevent self-tagging
                }
                com.kaleidoscope.backend.blogs.model.BlogTag newTag = com.kaleidoscope.backend.blogs.model.BlogTag.builder()
                        .taggingBlog(savedBlog)
                        .taggedBlog(taggedBlog)
                        .build();
                newTags.add(newTag);

                // Publish notification to the author of the tagged blog
                publishBlogTagNotification(savedBlog, taggedBlog);
            }

            if (!newTags.isEmpty()) {
                blogTagRepository.saveAll(newTags);
                savedBlog.setTaggedBlogs(new HashSet<>(newTags)); // Update in-memory entity for mapping
            }
        }

        // Handle media if provided
        if (blogCreateRequestDTO.mediaDetails() != null && !blogCreateRequestDTO.mediaDetails().isEmpty()) {
            List<BlogMedia> blogMediaList = blogMapper.toBlogMediaEntities(blogCreateRequestDTO.mediaDetails());
            for (BlogMedia mediaItem : blogMediaList) {
                if (!imageStorageService.validateBlogImageUrl(mediaItem.getMediaUrl())) {
                    throw new IllegalArgumentException("Invalid or untrusted media URL: " + mediaItem.getMediaUrl());
                }
                String publicId = imageStorageService.extractPublicIdFromUrl(mediaItem.getMediaUrl());
                MediaAssetTracker tracker = mediaAssetTrackerRepository.findByPublicId(publicId)
                        .orElseThrow(() -> new IllegalArgumentException("Media asset not tracked for public_id: " + publicId));

                if (tracker.getStatus() != MediaAssetStatus.PENDING) {
                    throw new IllegalArgumentException("Media asset must be in PENDING state to be associated. Current state: " + tracker.getStatus());
                }
                savedBlog.addMedia(mediaItem); // Add media to the saved blog instance
                tracker.setStatus(MediaAssetStatus.ASSOCIATED);
                tracker.setContentType(ContentType.BLOG.name());
                tracker.setContentId(savedBlog.getBlogId()); // Use the ID from the saved blog
            }
            // Save again to persist the new media relationships
            savedBlog = blogRepository.save(savedBlog);
        }

        // Index new blog in Elasticsearch
        BlogDocument blogDocument = blogMapper.toBlogDocument(savedBlog);
        blogSearchRepository.save(blogDocument);
        log.info("Indexed new blog {} to Elasticsearch", savedBlog.getBlogId());

        log.info("User '{}' created new blog with ID: {}", currentUser.getUsername(), savedBlog.getBlogId());
        return blogMapper.toDTO(savedBlog);
    }


    @Override
    @Transactional
    public BlogCreationResponseDTO updateBlog(Long blogId, BlogUpdateRequestDTO blogUpdateRequestDTO) {
        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new BlogNotFoundException(blogId));

        Long currentUserId = jwtUtils.getUserIdFromContext();
        if (!blog.getUser().getUserId().equals(currentUserId)) {
            throw new UnauthorizedBlogActionException("User is not authorized to edit this blog.");
        }

        // Let the mapper handle all DTO-to-entity field updates
        blogMapper.updateEntityFromDTO(blog, blogUpdateRequestDTO);

        // Handle media updates if provided
        if (blogUpdateRequestDTO.mediaDetails() != null) {
            updateBlogMedia(blog, blogUpdateRequestDTO.mediaDetails());
        }
        if (blogUpdateRequestDTO.categoryIds() != null) {
            Set<Category> categories = new HashSet<>(categoryRepository.findAllById(blogUpdateRequestDTO.categoryIds()));
            if (categories.size() != blogUpdateRequestDTO.categoryIds().size()) {
                Set<Long> foundCategoryIds = categories.stream()
                        .map(Category::getCategoryId)
                        .collect(Collectors.toSet());
                Set<Long> missingCategoryIds = blogUpdateRequestDTO.categoryIds().stream()
                        .filter(id -> !foundCategoryIds.contains(id))
                        .collect(Collectors.toSet());
                throw new CategoryNotFoundException("Categories not found with IDs: " + missingCategoryIds);
            }
            blog.getCategories().clear();
            categories.forEach(blog::addCategory);
        }

        // Handle location updates
        if (blogUpdateRequestDTO.locationId() != null) {
            Location location = locationRepository.findById(blogUpdateRequestDTO.locationId())
                    .orElseThrow(() -> new LocationNotFoundException("Location not found with ID: " + blogUpdateRequestDTO.locationId()));
            blog.setLocation(location);
        } else {
            blog.setLocation(null);
        }

        // Handle blog tag updates if provided
        if (blogUpdateRequestDTO.blogTagIds() != null) {
            updateBlogTags(blog, blogUpdateRequestDTO.blogTagIds());
        }

        Blog savedBlog = blogRepository.save(blog);
        // Sync updated blog to Elasticsearch
        BlogDocument blogDocument = blogMapper.toBlogDocument(savedBlog);
        blogSearchRepository.save(blogDocument);
        log.info("Updated blog {} in Elasticsearch", savedBlog.getBlogId());
        log.info("User '{}' updated blog with ID: {}", blog.getUser().getUsername(), savedBlog.getBlogId());
        return blogMapper.toDTO(savedBlog);
    }

    @Override
    @Transactional
    public void softDeleteBlog(Long blogId) {
        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new BlogNotFoundException(blogId));

        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();

        if (!isAdmin && !blog.getUser().getUserId().equals(currentUserId)) {
            throw new UnauthorizedBlogActionException("User is not authorized to delete this blog.");
        }

        // Remove from Elasticsearch before DB soft delete
        blogSearchRepository.deleteById(blogId.toString());
        log.info("Removed blog {} from Elasticsearch index", blogId);
        blogRepository.delete(blog);
        log.info("Blog {} soft-deleted by user {} (admin? {})", blogId, currentUserId, isAdmin);
    }

    @Override
    @Transactional
    public void hardDeleteBlog(Long blogId) {
        boolean isAdmin = jwtUtils.isAdminFromContext();
        if (!isAdmin) {
            throw new UnauthorizedBlogActionException("Only administrators can perform hard delete operations.");
        }

        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new BlogNotFoundException(blogId));

        // Delete ES document
        blogSearchRepository.deleteById(blog.getBlogId().toString());
        // Delete associated comments and reactions
        commentRepository.softDeleteCommentsByContent(blogId, ContentType.BLOG, LocalDateTime.now());
        reactionRepository.softDeleteReactionsByContent(blogId, ContentType.BLOG, LocalDateTime.now());


        for (BlogMedia media : blog.getMedia()) {
            String publicId = imageStorageService.extractPublicIdFromUrl(media.getMediaUrl());
            mediaAssetTrackerRepository.findByPublicId(publicId).ifPresent(tracker -> {
                tracker.setStatus(MediaAssetStatus.UNLINKED);
                tracker.setContentType(ContentType.BLOG.name());
                tracker.setContentId(blog.getBlogId());
            });
            imageStorageService.deleteImageByPublicId(imageStorageService.extractPublicIdFromUrl(media.getMediaUrl()));
        }

        blog.getMedia().clear();
        blog.getCategories().clear();
        blogRepository.hardDeleteById(blog.getBlogId());
        log.info("Blog {} hard-deleted by admin", blogId);
    }

    @Override
    @Transactional(readOnly = true)
    public BlogDetailResponseDTO getBlogById(Long blogId) {
        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new BlogNotFoundException(blogId));
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        boolean isOwner = blog.getUser().getUserId().equals(currentUserId);
        if (!isAdmin && !isOwner) {
            if (blog.getBlogStatus() != BlogStatus.PUBLISHED) {
                throw new UnauthorizedBlogActionException("Not allowed to view this blog");
            }
            // Track view count for non-owners
            blogViewService.incrementViewAsync(blogId, currentUserId);
            log.debug("View tracking initiated for blog {} by user {}", blogId, currentUserId);
        }
        ReactionType currentUserReaction = null;
        var reactionOpt = reactionRepository.findByContentAndUser(blogId, ContentType.BLOG, currentUserId);
        if (reactionOpt.isPresent()) {
            currentUserReaction = reactionOpt.get().getReactionType();
        }
        return blogMapper.toBlogDetailDTO(blog, currentUserReaction);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<BlogSummaryResponseDTO> filterBlogs(Pageable pageable, Long userId, Long categoryId, String status, String visibility, String q) {
        // Replace JPA specification with Elasticsearch query
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        BlogStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try { statusEnum = BlogStatus.valueOf(status); } catch (IllegalArgumentException ignored) { log.warn("Invalid status filter '{}' ignored", status); }
        }
        Page<BlogDocument> docPage = blogSearchRepository.findVisibleAndFilteredBlogs(
                currentUserId,
                isAdmin,
                userId,
                categoryId,
                statusEnum,
                q,
                null, // location filtering not yet implemented in API signature
                pageable
        );
        Page<BlogSummaryResponseDTO> dtoPage = docPage.map(blogMapper::toBlogSummaryDTO);
        log.info("Blog filter returned {} of {} results via Elasticsearch", dtoPage.getNumberOfElements(), dtoPage.getTotalElements());
        return PaginatedResponse.fromPage(dtoPage);
    }

    @Override
    @Transactional
    public BlogCreationResponseDTO updateBlogStatus(Long blogId, BlogStatusUpdateRequestDTO requestDTO) {
        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new BlogNotFoundException(blogId));

        Long reviewerId = jwtUtils.getUserIdFromContext();
        User reviewer = userRepository.findByUserId(reviewerId);
        if (reviewer == null) {
            throw new IllegalArgumentException("Reviewer not found for ID: " + reviewerId);
        }

        blog.setBlogStatus(requestDTO.status());
        blog.setReviewer(reviewer);
        blog.setReviewedAt(LocalDateTime.now());

        Blog savedBlog = blogRepository.save(blog);

        // Publish notification to author
        publishBlogStatusNotification(savedBlog, reviewerId);

        // Sync status update to Elasticsearch
        BlogDocument blogDocument = blogMapper.toBlogDocument(savedBlog);
        blogSearchRepository.save(blogDocument);
        log.info("Updated blog status {} in Elasticsearch", savedBlog.getBlogId());
        log.info("Blog {} status updated to {} by admin {}", blogId, requestDTO.status(), reviewerId);

        return blogMapper.toDTO(savedBlog);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<BlogSummaryResponseDTO> getBlogsThatTag(Long blogId, Pageable pageable) {
        // Check if the blog exists first
        if (!blogRepository.existsById(blogId)) {
            throw new BlogNotFoundException(blogId);
        }

        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();

        // Use the search repository to find tagging blogs
        Page<BlogDocument> docPage = blogSearchRepository.findBlogsThatTag(
                blogId, currentUserId, isAdmin, pageable
        );

        Page<BlogSummaryResponseDTO> dtoPage = docPage.map(blogMapper::toBlogSummaryDTO);
        log.info("Found {} blogs tagging blogId: {}", dtoPage.getTotalElements(), blogId);
        return PaginatedResponse.fromPage(dtoPage);
    }

    private void updateBlogMedia(Blog blog, List<MediaUploadRequestDTO> mediaDtos) {
        log.debug("Updating media for blogId: {}", blog.getBlogId());
        if (mediaDtos == null) return;

        Map<Long, BlogMedia> existingMediaMap = blog.getMedia().stream()
                .collect(Collectors.toMap(BlogMedia::getMediaId, media -> media));

        Set<Long> incomingMediaIds = new HashSet<>();
        List<BlogMedia> finalMediaList = new ArrayList<>();

        for (MediaUploadRequestDTO dto : mediaDtos) {
            if (dto.mediaId() == null) {
                log.debug("Adding new media from URL: {}", dto.url());
                String publicId = imageStorageService.extractPublicIdFromUrl(dto.url());
                MediaAssetTracker tracker = mediaAssetTrackerRepository.findByPublicId(publicId)
                        .orElseThrow(() -> {
                            log.error("Media asset not tracked for public_id: {}", publicId);
                            return new IllegalArgumentException("Media asset not tracked for public_id: " + publicId);
                        });

                if (tracker.getStatus() != MediaAssetStatus.PENDING) {
                    log.error("Cannot associate a media asset that is not in PENDING state. Status: {}", tracker.getStatus());
                    throw new IllegalArgumentException("Cannot associate a media asset that is not in PENDING state.");
                }

                BlogMedia newMedia = blogMapper.toBlogMediaEntities(Collections.singletonList(dto)).stream().findFirst().orElse(null);
                if (newMedia != null) {
                    finalMediaList.add(newMedia);
                    tracker.setStatus(MediaAssetStatus.ASSOCIATED);
                    tracker.setContentType(ContentType.BLOG.name());
                    tracker.setContentId(blog.getBlogId());
                    log.debug("Associated new media with blog");
                }
            } else {
                incomingMediaIds.add(dto.mediaId());
                BlogMedia existingMedia = existingMediaMap.get(dto.mediaId());
                if (existingMedia != null) {
                    log.debug("Updating position for existing mediaId: {}", dto.mediaId());
                    existingMedia.setPosition(dto.position());
                    finalMediaList.add(existingMedia);
                }
            }
        }

        // Mark removed media for deletion
        for (Map.Entry<Long, BlogMedia> entry : existingMediaMap.entrySet()) {
            if (!incomingMediaIds.contains(entry.getKey())) {
                log.debug("Marking media for delete: {}", entry.getValue().getMediaUrl());
                String publicId = imageStorageService.extractPublicIdFromUrl(entry.getValue().getMediaUrl());
                mediaAssetTrackerRepository.findByPublicId(publicId).ifPresent(tracker -> {
                    tracker.setStatus(MediaAssetStatus.MARKED_FOR_DELETE);
                    tracker.setContentType(ContentType.BLOG.name());
                    tracker.setContentId(blog.getBlogId());
                });
            }
        }

        // Clear existing media and add the final list
        blog.getMedia().clear();
        for (BlogMedia media : finalMediaList) {
            blog.addMedia(media);
        }
    }

    private void publishBlogStatusNotification(Blog blog, Long actorId) {
        try {
            Long recipientId = blog.getUser().getUserId();

            // Don't send a notification if the author is the one changing the status
            if (recipientId.equals(actorId)) {
                log.debug("Skipping notification: Author {} is changing their own blog status.", actorId);
                return;
            }

            String message;
            NotificationType notificationType;

            switch (blog.getBlogStatus()) {
                case APPROVED:
                    message = String.format("Your blog '%s' has been approved by an admin.", blog.getTitle());
                    notificationType = NotificationType.SYSTEM_MESSAGE; // Using SYSTEM_MESSAGE as a generic type
                    break;
                case REJECTED:
                    message = String.format("Your blog '%s' has been rejected by an admin.", blog.getTitle());
                    notificationType = NotificationType.SYSTEM_MESSAGE;
                    break;
                case PUBLISHED:
                    message = String.format("Your blog '%s' has been published.", blog.getTitle());
                    notificationType = NotificationType.SYSTEM_MESSAGE;
                    break;
                default:
                    // Do not send notifications for other statuses (DRAFT, APPROVAL_PENDING, etc.)
                    log.debug("Blog status {} does not trigger a notification.", blog.getBlogStatus());
                    return;
            }

            Map<String, String> additionalData = Map.of(
                "message", message,
                "blogTitle", blog.getTitle()
            );

            NotificationEventDTO notificationEvent = new NotificationEventDTO(
                    notificationType,
                    recipientId,  // The author of the blog
                    actorId,      // The admin who changed the status
                    blog.getBlogId(),
                    ContentType.BLOG,
                    additionalData,
                    MDC.get("correlationId")
            );

            redisStreamPublisher.publish(ProducerStreamConstants.NOTIFICATION_EVENTS_STREAM, notificationEvent);
            log.info("Published blog status update notification ({}) for recipientId: {}", blog.getBlogStatus(), recipientId);

        } catch (Exception e) {
            log.error("Failed to publish blog status notification for blogId {}: {}", blog.getBlogId(), e.getMessage(), e);
            // Do not re-throw; notification failure should not fail the main transaction.
        }
    }

    private void updateBlogTags(Blog blog, List<Long> incomingBlogTagIds) {
        Set<Long> incomingIds = (incomingBlogTagIds != null) ? new HashSet<>(incomingBlogTagIds) : Collections.emptySet();

        // 1. Get current tags
        Map<Long, com.kaleidoscope.backend.blogs.model.BlogTag> existingTagsMap = blog.getTaggedBlogs().stream()
                .collect(Collectors.toMap(tag -> tag.getTaggedBlog().getBlogId(), tag -> tag));
        Set<Long> existingIds = existingTagsMap.keySet();

        // 2. Find and remove tags that are no longer present
        List<com.kaleidoscope.backend.blogs.model.BlogTag> tagsToRemove = existingIds.stream()
                .filter(id -> !incomingIds.contains(id))
                .map(existingTagsMap::get)
                .collect(Collectors.toList());

        if (!tagsToRemove.isEmpty()) {
            blogTagRepository.deleteAll(tagsToRemove);
            tagsToRemove.forEach(tag -> blog.getTaggedBlogs().remove(tag));
            log.debug("Removed {} blog tags from blog ID: {}", tagsToRemove.size(), blog.getBlogId());
        }

        // 3. Find and add new tags
        List<Long> idsToAdd = incomingIds.stream()
                .filter(id -> !existingIds.contains(id))
                .filter(id -> !id.equals(blog.getBlogId())) // Prevent self-tag
                .collect(Collectors.toList());

        if (!idsToAdd.isEmpty()) {
            List<Blog> taggedBlogs = blogRepository.findAllById(idsToAdd);
            List<com.kaleidoscope.backend.blogs.model.BlogTag> newTags = new ArrayList<>();

            for (Blog taggedBlog : taggedBlogs) {
                com.kaleidoscope.backend.blogs.model.BlogTag newTag = com.kaleidoscope.backend.blogs.model.BlogTag.builder()
                        .taggingBlog(blog)
                        .taggedBlog(taggedBlog)
                        .build();
                newTags.add(newTag);

                // 4. Send notification for each new tag
                publishBlogTagNotification(blog, taggedBlog);
            }

            if (!newTags.isEmpty()) {
                blogTagRepository.saveAll(newTags);
                blog.getTaggedBlogs().addAll(newTags);
                log.debug("Added {} new blog tags to blog ID: {}", newTags.size(), blog.getBlogId());
            }
        }
    }

    private void publishBlogTagNotification(Blog taggingBlog, Blog taggedBlog) {
        try {
            Long recipientId = taggedBlog.getUser().getUserId();
            Long actorId = taggingBlog.getUser().getUserId();

            // Do not send a notification if the author is tagging their own blog
            if (recipientId.equals(actorId)) {
                return;
            }

            // Craft the message
            String message = String.format("Your blog '%s' was tagged in '%s'", taggedBlog.getTitle(), taggingBlog.getTitle());

            Map<String, String> additionalData = Map.of(
                "message", message,
                "taggingBlogTitle", taggingBlog.getTitle(),
                "taggedBlogTitle", taggedBlog.getTitle()
            );

            // Create the notification DTO
            NotificationEventDTO notificationEvent = new NotificationEventDTO(
                    NotificationType.SYSTEM_MESSAGE, // Using SYSTEM_MESSAGE
                    recipientId,  // The author of the tagged blog
                    actorId,      // The author of the tagging blog
                    taggingBlog.getBlogId(), // Link to the blog that did the tagging
                    ContentType.BLOG,
                    additionalData,
                    MDC.get("correlationId")
            );

            // Publish to Redis
            redisStreamPublisher.publish(ProducerStreamConstants.NOTIFICATION_EVENTS_STREAM, notificationEvent);
            log.info("Published blog tag notification for recipientId: {}", recipientId);

        } catch (Exception e) {
            log.error("Failed to publish blog tag notification for blogId {}: {}", taggingBlog.getBlogId(), e.getMessage(), e);
            // Do not re-throw
        }
    }
}
