package com.kaleidoscope.backend.blogs.mapper;

import com.kaleidoscope.backend.blogs.document.BlogDocument;
import com.kaleidoscope.backend.blogs.dto.request.BlogCreateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogCreationResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogDetailResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogMediaResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogTagResponseDTO;
import com.kaleidoscope.backend.blogs.model.Blog;
import com.kaleidoscope.backend.blogs.model.BlogMedia;
import com.kaleidoscope.backend.blogs.repository.BlogRepository;
import com.kaleidoscope.backend.blogs.service.BlogViewService;
import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CategorySummaryResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.shared.repository.CommentRepository;
import com.kaleidoscope.backend.shared.repository.ReactionRepository;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Component
public class BlogMapper {

    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final BlogRepository blogRepository;
    private final BlogViewService blogViewService;

    public BlogMapper(CommentRepository commentRepository, ReactionRepository reactionRepository, BlogRepository blogRepository, BlogViewService blogViewService) {
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
        this.blogRepository = blogRepository;
        this.blogViewService = blogViewService;
    }

    public Blog toEntity(BlogCreateRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        return Blog.builder()
                .title(dto.title())
                .body(dto.body())
                .summary(dto.summary())
                .build();
    }

    public void updateEntityFromDTO(Blog blog, BlogUpdateRequestDTO dto) {
        if (blog == null || dto == null) {
            return;
        }
        blog.setTitle(dto.title());
        blog.setBody(dto.body());
        blog.setSummary(dto.summary());
    }

    public BlogCreationResponseDTO toDTO(Blog blog) {
        if (blog == null) {
            return null;
        }

        UserDetailsSummaryResponseDTO authorDto = toUserSummaryDTO(blog.getUser());
        LocationResponseDTO locationDto = toLocationResponseDTO(blog.getLocation());

        return BlogCreationResponseDTO.builder()
                .blogId(blog.getBlogId())
                .title(blog.getTitle())
                .body(blog.getBody())
                .summary(blog.getSummary())
                .wordCount(blog.getWordCount())
                .readTimeMinutes(blog.getReadTimeMinutes())
                .blogStatus(blog.getBlogStatus())
                .createdAt(blog.getCreatedAt())
                .updatedAt(blog.getUpdatedAt())
                .author(authorDto)
                .categories(mapCategories(blog))
                .media(mapMedia(blog))
                .location(locationDto)
                .blogTags(mapBlogTags(blog))
                .build();
    }

    public BlogDetailResponseDTO toBlogDetailDTO(Blog blog, ReactionType currentUserReaction) {
        if (blog == null) {
            return null;
        }

        UserDetailsSummaryResponseDTO authorDto = toUserSummaryDTO(blog.getUser());
        UserDetailsSummaryResponseDTO reviewerDto = toUserSummaryDTO(blog.getReviewer());
        LocationResponseDTO locationDto = toLocationResponseDTO(blog.getLocation());

        long reactionCount = reactionRepository.countByContentIdAndContentType(blog.getBlogId(), ContentType.BLOG);
        long commentCount = commentRepository.countByContentIdAndContentType(blog.getBlogId(), ContentType.BLOG);
        long viewCount = blogViewService.getViewCount(blog.getBlogId());

        return BlogDetailResponseDTO.builder()
                .blogId(blog.getBlogId())
                .title(blog.getTitle())
                .body(blog.getBody())
                .summary(blog.getSummary())
                .wordCount(blog.getWordCount())
                .readTimeMinutes(blog.getReadTimeMinutes())
                .blogStatus(blog.getBlogStatus())
                .createdAt(blog.getCreatedAt())
                .updatedAt(blog.getUpdatedAt())
                .reviewedAt(blog.getReviewedAt())
                .author(authorDto)
                .reviewer(reviewerDto)
                .categories(mapCategories(blog))
                .media(mapMedia(blog))
                .location(locationDto)
                .reactionCount(reactionCount)
                .commentCount(commentCount)
                .viewCount(viewCount)
                .tags(mapBlogTags(blog))
                .currentUserReaction(currentUserReaction)
                .build();
    }

    public BlogSummaryResponseDTO toBlogSummaryDTO(Blog blog) {
        if (blog == null) {
            return null;
        }

        UserDetailsSummaryResponseDTO authorDto = toUserSummaryDTO(blog.getUser());
        String thumbnailUrl = getThumbnailUrl(blog);

        long reactionCount = reactionRepository.countByContentIdAndContentType(blog.getBlogId(), ContentType.BLOG);
        long commentCount = commentRepository.countByContentIdAndContentType(blog.getBlogId(), ContentType.BLOG);
        long viewCount = blogViewService.getViewCount(blog.getBlogId());

        return BlogSummaryResponseDTO.builder()
                .blogId(blog.getBlogId())
                .title(blog.getTitle())
                .summary(blog.getSummary())
                .createdAt(blog.getCreatedAt())
                .author(authorDto)
                .categories(mapCategories(blog))
                .thumbnailUrl(thumbnailUrl)
                .reactionCount(reactionCount)
                .commentCount(commentCount)
                .viewCount(viewCount)
                .blogStatus(blog.getBlogStatus())
                .build();
    }

    public BlogSummaryResponseDTO toBlogSummaryDTO(BlogDocument document) {
        if (document == null) {
            return null;
        }
        UserDetailsSummaryResponseDTO authorDto = null;
        if (document.getAuthor() != null) {
            BlogDocument.Author a = document.getAuthor();
            authorDto = new UserDetailsSummaryResponseDTO(
                    a.getUserId(),
                    a.getEmail(),
                    a.getUsername(),
                    a.getAccountStatus(),
                    a.getProfilePictureUrl()
            );
        }
        List<CategorySummaryResponseDTO> categoryDtos = document.getCategories() != null ? document.getCategories().stream()
                .map(c -> new CategorySummaryResponseDTO(c.getCategoryId(), c.getName()))
                .collect(Collectors.toList()) : List.of();
        return BlogSummaryResponseDTO.builder()
                .blogId(document.getBlogId())
                .title(document.getTitle())
                .summary(document.getSummary())
                .createdAt(document.getCreatedAt())
                .author(authorDto)
                .categories(categoryDtos)
                .thumbnailUrl(document.getThumbnailUrl())
                .reactionCount(document.getReactionCount())
                .commentCount(document.getCommentCount())
                .viewCount(document.getViewCount())
                .blogStatus(document.getBlogStatus())
                .build();
    }

    public BlogDocument toBlogDocument(Blog blog) {
        if (blog == null) {
            return null;
        }
        String thumbnailUrl = getThumbnailUrl(blog);
        BlogDocument.Author author = null;
        if (blog.getUser() != null) {
            author = BlogDocument.Author.builder()
                    .userId(blog.getUser().getUserId())
                    .username(blog.getUser().getUsername())
                    .profilePictureUrl(blog.getUser().getProfilePictureUrl())
                    .email(blog.getUser().getEmail())
                    .accountStatus(blog.getUser().getAccountStatus() != null ? blog.getUser().getAccountStatus().name() : null)
                    .build();
        }
        BlogDocument.Reviewer reviewer = null;
        if (blog.getReviewer() != null) {
            reviewer = BlogDocument.Reviewer.builder()
                    .userId(blog.getReviewer().getUserId())
                    .username(blog.getReviewer().getUsername())
                    .profilePictureUrl(blog.getReviewer().getProfilePictureUrl())
                    .email(blog.getReviewer().getEmail())
                    .accountStatus(blog.getReviewer().getAccountStatus() != null ? blog.getReviewer().getAccountStatus().name() : null)
                    .build();
        }
        List<BlogDocument.Category> categories = blog.getCategories().stream()
                .map(bc -> BlogDocument.Category.builder()
                        .categoryId(bc.getCategory().getCategoryId())
                        .name(bc.getCategory().getName())
                        .build())
                .collect(Collectors.toList());
        BlogDocument.LocationInfo locationInfo = null;
        Location loc = blog.getLocation();
        if (loc != null) {
            if (loc.getLatitude() != null && loc.getLongitude() != null) {
                org.springframework.data.elasticsearch.core.geo.GeoPoint point = new org.springframework.data.elasticsearch.core.geo.GeoPoint(
                        loc.getLatitude().doubleValue(),
                        loc.getLongitude().doubleValue()
                );
                locationInfo = BlogDocument.LocationInfo.builder()
                        .id(loc.getLocationId())
                        .name(loc.getName())
                        .point(point)
                        .build();
            } else {
                locationInfo = BlogDocument.LocationInfo.builder()
                        .id(loc.getLocationId())
                        .name(loc.getName())
                        .point(null)
                        .build();
            }
        }
        List<BlogDocument.BlogTagInfo> tagInfos = blog.getTaggedBlogs().stream()
                .map(t -> BlogDocument.BlogTagInfo.builder()
                        .blogId(t.getTaggedBlog().getBlogId())
                        .title(t.getTaggedBlog().getTitle())
                        .build())
                .collect(Collectors.toList());
        return BlogDocument.builder()
                .id(blog.getBlogId().toString())
                .blogId(blog.getBlogId())
                .title(blog.getTitle())
                .body(blog.getBody())
                .summary(blog.getSummary())
                .thumbnailUrl(thumbnailUrl)
                .wordCount(blog.getWordCount())
                .readTimeMinutes(blog.getReadTimeMinutes())
                .blogStatus(blog.getBlogStatus())
                .createdAt(blog.getCreatedAt())
                .updatedAt(blog.getUpdatedAt())
                .reviewedAt(blog.getReviewedAt())
                .author(author)
                .reviewer(reviewer)
                .categories(categories)
                .location(locationInfo)
                .blogTags(tagInfos)
                .reactionCount(0L)
                .commentCount(0L)
                .viewCount(0L)
                .build();
    }

    public List<BlogMedia> toBlogMediaEntities(List<MediaUploadRequestDTO> mediaDtos) {
        if (mediaDtos == null) {
            return List.of();
        }
        AtomicInteger autoPosition = new AtomicInteger(0);
        return mediaDtos.stream().map(mediaDto -> BlogMedia.builder()
                .mediaUrl(mediaDto.url())
                .mediaType(mediaDto.mediaType())
                .position(mediaDto.position() != null ? mediaDto.position() : autoPosition.getAndIncrement())
                .width(mediaDto.width())
                .height(mediaDto.height())
                .fileSizeKb(mediaDto.fileSizeKb())
                .durationSeconds(mediaDto.durationSeconds())
                .extraMetadata(mediaDto.extraMetadata())
                .build()
        ).collect(Collectors.toList());
    }

    private UserDetailsSummaryResponseDTO toUserSummaryDTO(User user) {
        if (user == null) {
            return null;
        }
        return new UserDetailsSummaryResponseDTO(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                user.getAccountStatus().name(),
                user.getProfilePictureUrl()
        );
    }

    private LocationResponseDTO toLocationResponseDTO(Location location) {
        if (location == null) {
            return null;
        }
        return LocationResponseDTO.builder()
                .locationId(location.getLocationId())
                .name(location.getName())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .address(location.getAddress())
                .build();
    }

    private List<CategorySummaryResponseDTO> mapCategories(Blog blog) {
        return blog.getCategories().stream()
                .map(bc -> {
                    Category cat = bc.getCategory();
                    return new CategorySummaryResponseDTO(
                            cat.getCategoryId(),
                            cat.getName()
                    );
                })
                .collect(Collectors.toList());
    }

    private List<BlogMediaResponseDTO> mapMedia(Blog blog) {
        return blog.getMedia().stream()
                .sorted(Comparator.comparing(BlogMedia::getPosition))
                .map(bm -> BlogMediaResponseDTO.builder()
                        .mediaId(bm.getMediaId())
                        .mediaUrl(bm.getMediaUrl())
                        .mediaType(bm.getMediaType())
                        .position(bm.getPosition())
                        .width(bm.getWidth())
                        .height(bm.getHeight())
                        .fileSizeKb(bm.getFileSizeKb())
                        .durationSeconds(bm.getDurationSeconds())
                        .extraMetadata(bm.getExtraMetadata())
                        .createdAt(bm.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private List<BlogTagResponseDTO> mapBlogTags(Blog blog) {
        return blog.getTaggedBlogs().stream()
                .map(tag -> new BlogTagResponseDTO(
                        tag.getTaggedBlog().getBlogId(),
                        tag.getTaggedBlog().getTitle()
                ))
                .collect(Collectors.toList());
    }

    private String getThumbnailUrl(Blog blog) {
        return blog.getMedia().stream()
                .min(Comparator.comparing(BlogMedia::getPosition))
                .map(BlogMedia::getMediaUrl)
                .orElse(null);
    }

    private static BlogMedia createBlogMediaFromDTO(MediaUploadRequestDTO mediaDto) {
        return BlogMedia.builder()
                .mediaUrl(mediaDto.url())
                .mediaType(mediaDto.mediaType())
                .position(mediaDto.position() != null ? mediaDto.position() : 0)
                .width(mediaDto.width())
                .height(mediaDto.height())
                .fileSizeKb(mediaDto.fileSizeKb())
                .durationSeconds(mediaDto.durationSeconds())
                .extraMetadata(mediaDto.extraMetadata())
                .build();
    }
}