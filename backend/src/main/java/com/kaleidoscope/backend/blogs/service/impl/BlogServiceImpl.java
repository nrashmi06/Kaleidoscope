package com.kaleidoscope.backend.blogs.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.blogs.dto.request.BlogCreateRequestDTO;
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
import com.kaleidoscope.backend.blogs.repository.specification.BlogSpecification;
import com.kaleidoscope.backend.blogs.service.BlogService;
import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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

    @Override
    @Transactional
    public BlogCreationResponseDTO createBlog(BlogCreateRequestDTO blogCreateRequestDTO) {
        Long userId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            throw new IllegalArgumentException("Authenticated user not found for ID: " + userId);
        }

        // Validate categories early and provide specific error message
        if (blogCreateRequestDTO.getCategoryIds() == null || blogCreateRequestDTO.getCategoryIds().isEmpty()) {
            throw new IllegalArgumentException("At least one category must be specified");
        }

        Set<Category> categories = new HashSet<>(categoryRepository.findAllById(blogCreateRequestDTO.getCategoryIds()));
        if (categories.size() != blogCreateRequestDTO.getCategoryIds().size()) {
            Set<Long> foundCategoryIds = categories.stream()
                    .map(Category::getCategoryId)
                    .collect(Collectors.toSet());
            Set<Long> missingCategoryIds = blogCreateRequestDTO.getCategoryIds().stream()
                    .filter(id -> !foundCategoryIds.contains(id))
                    .collect(Collectors.toSet());
            throw new CategoryNotFoundException("Categories not found with IDs: " + missingCategoryIds);
        }

        Blog blog = blogMapper.toEntity(blogCreateRequestDTO);
        blog.setUser(currentUser);
        blog.setBlogStatus(BlogStatus.APPROVAL_PENDING);

        if (blogCreateRequestDTO.getLocationId() != null) {
            Location location = locationRepository.findById(blogCreateRequestDTO.getLocationId())
                    .orElseThrow(() -> new LocationNotFoundException(blogCreateRequestDTO.getLocationId()));
            blog.setLocation(location);
        }

        // Save the blog first to generate its ID
        Blog savedBlog = blogRepository.save(blog);

        // Now add categories after the blog has an ID
        categories.forEach(savedBlog::addCategory);

        // Save again to persist the category relationships
        savedBlog = blogRepository.save(savedBlog);

        if (blogCreateRequestDTO.getMediaDetails() != null && !blogCreateRequestDTO.getMediaDetails().isEmpty()) {
            List<BlogMedia> mediaItems = blogMapper.toBlogMediaEntities(blogCreateRequestDTO.getMediaDetails());
            for (BlogMedia mediaItem : mediaItems) {
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

        updateBlogMedia(blog, blogUpdateRequestDTO.getMediaDetails());

        if (blogUpdateRequestDTO.getCategoryIds() != null) {
            Set<Category> categories = new HashSet<>(categoryRepository.findAllById(blogUpdateRequestDTO.getCategoryIds()));
            if (categories.size() != blogUpdateRequestDTO.getCategoryIds().size()) {
                Set<Long> foundCategoryIds = categories.stream()
                        .map(Category::getCategoryId)
                        .collect(Collectors.toSet());
                Set<Long> missingCategoryIds = blogUpdateRequestDTO.getCategoryIds().stream()
                        .filter(id -> !foundCategoryIds.contains(id))
                        .collect(Collectors.toSet());
                throw new CategoryNotFoundException("Categories not found with IDs: " + missingCategoryIds);
            }
            blog.getCategories().clear();
            categories.forEach(blog::addCategory);
        }

        if (blogUpdateRequestDTO.getLocationId() != null) {
            Location location = locationRepository.findById(blogUpdateRequestDTO.getLocationId())
                    .orElseThrow(() -> new LocationNotFoundException(blogUpdateRequestDTO.getLocationId()));
            blog.setLocation(location);
        } else {
            blog.setLocation(null);
        }

        Blog savedBlog = blogRepository.save(blog);
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
        Specification<Blog> spec = Specification.where(null);
        if (userId != null) {
            spec = spec.and(BlogSpecification.hasAuthor(userId));
        }
        if (categoryId != null) {
            spec = spec.and(BlogSpecification.hasCategory(categoryId));
        }
        if (status != null) {
            spec = spec.and(BlogSpecification.hasStatus(status));
        }
        // If you have a visibility field, add similar logic here
        if (q != null && !q.isEmpty()) {
            spec = spec.and(BlogSpecification.containsQuery(q));
        }
        Page<Blog> blogPage = blogRepository.findAll(spec, pageable);
        List<BlogSummaryResponseDTO> dtos = blogPage.getContent().stream()
            .map(blogMapper::toBlogSummaryDTO)
            .collect(Collectors.toList());
        // Use builder for PaginatedResponse
        return PaginatedResponse.<BlogSummaryResponseDTO>builder()
            .content(dtos)
            .page(blogPage.getNumber())
            .size(blogPage.getSize())
            .totalPages(blogPage.getTotalPages())
            .totalElements(blogPage.getTotalElements())
            .first(blogPage.isFirst())
            .last(blogPage.isLast())
            .build();
    }

    private void updateBlogMedia(Blog blog, List<MediaUploadRequestDTO> mediaDtos) {
        if (mediaDtos == null) return;

        Map<Long, BlogMedia> existingMediaMap = blog.getMedia().stream()
                .collect(Collectors.toMap(BlogMedia::getMediaId, media -> media));

        Set<Long> incomingMediaIds = new HashSet<>();
        List<BlogMedia> finalMediaList = new ArrayList<>();

        for (MediaUploadRequestDTO dto : mediaDtos) {
            if (dto.getMediaId() == null) {
                String publicId = imageStorageService.extractPublicIdFromUrl(dto.getUrl());
                MediaAssetTracker tracker = mediaAssetTrackerRepository.findByPublicId(publicId)
                        .orElseThrow(() -> new IllegalArgumentException("Media asset not tracked for public_id: " + publicId));

                if (tracker.getStatus() != MediaAssetStatus.PENDING) {
                    throw new IllegalArgumentException("Cannot associate a media asset that is not in PENDING state.");
                }

                BlogMedia newMedia = blogMapper.toBlogMediaEntities(Collections.singletonList(dto)).stream().findFirst().orElse(null);
                finalMediaList.add(newMedia);

                tracker.setStatus(MediaAssetStatus.ASSOCIATED);
                tracker.setContentType(ContentType.BLOG.name());
                tracker.setContentId(blog.getBlogId());
            } else {
                incomingMediaIds.add(dto.getMediaId());
                BlogMedia existingMedia = existingMediaMap.get(dto.getMediaId());
                if (existingMedia != null) {
                    existingMedia.setPosition(dto.getPosition());
                    finalMediaList.add(existingMedia);
                }
            }
        }

        for (Map.Entry<Long, BlogMedia> entry : existingMediaMap.entrySet()) {
            if (!incomingMediaIds.contains(entry.getKey())) {
                String publicId = imageStorageService.extractPublicIdFromUrl(entry.getValue().getMediaUrl());
                mediaAssetTrackerRepository.findByPublicId(publicId).ifPresent(tracker -> {
                    tracker.setStatus(MediaAssetStatus.MARKED_FOR_DELETE);
                    tracker.setContentType(ContentType.BLOG.name());
                    tracker.setContentId(blog.getBlogId());
                });
            }
        }

        blog.getMedia().clear();
        for(BlogMedia media : finalMediaList) {
            blog.addMedia(media);
        }
    }
}
