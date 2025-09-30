package com.kaleidoscope.backend.blogs.mapper;

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

    public BlogMapper(CommentRepository commentRepository, ReactionRepository reactionRepository, BlogRepository blogRepository) {
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
        this.blogRepository = blogRepository;
    }

    public Blog toEntity(BlogCreateRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        return Blog.builder()
                .title(dto.getTitle())
                .body(dto.getBody())
                .summary(dto.getSummary())
                .build();
    }

    public void updateEntityFromDTO(Blog blog, BlogUpdateRequestDTO dto) {
        if (blog == null || dto == null) {
            return;
        }
        blog.setTitle(dto.getTitle());
        blog.setBody(dto.getBody());
        blog.setSummary(dto.getSummary());
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
                .blogStatus(blog.getBlogStatus())
                .build();
    }

    public List<BlogMedia> toBlogMediaEntities(List<MediaUploadRequestDTO> mediaDtos) {
        if (mediaDtos == null) {
            return List.of();
        }
        AtomicInteger autoPosition = new AtomicInteger(0);
        return mediaDtos.stream().map(mediaDto -> BlogMedia.builder()
                .mediaUrl(mediaDto.getUrl())
                .mediaType(mediaDto.getMediaType())
                .position(mediaDto.getPosition() != null ? mediaDto.getPosition() : autoPosition.getAndIncrement())
                .width(mediaDto.getWidth())
                .height(mediaDto.getHeight())
                .fileSizeKb(mediaDto.getFileSizeKb())
                .durationSeconds(mediaDto.getDurationSeconds())
                .extraMetadata(mediaDto.getExtraMetadata())
                .build()
        ).collect(Collectors.toList());
    }

    private UserDetailsSummaryResponseDTO toUserSummaryDTO(User user) {
        if (user == null) {
            return null;
        }
        return UserDetailsSummaryResponseDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .accountStatus(user.getAccountStatus().name())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build();
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
                    return CategorySummaryResponseDTO.builder()
                            .categoryId(cat.getCategoryId())
                            .name(cat.getName())
                            .build();
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
                .map(tag -> BlogTagResponseDTO.builder()
                        .blogId(tag.getTaggedBlog().getBlogId())
                        .title(tag.getTaggedBlog().getTitle())
                        .build())
                .collect(Collectors.toList());
    }

    private String getThumbnailUrl(Blog blog) {
        return blog.getMedia().stream()
                .min(Comparator.comparing(BlogMedia::getPosition))
                .map(BlogMedia::getMediaUrl)
                .orElse(null);
    }
}