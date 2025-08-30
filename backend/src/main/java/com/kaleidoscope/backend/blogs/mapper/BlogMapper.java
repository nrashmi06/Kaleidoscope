package com.kaleidoscope.backend.blogs.mapper;

import com.kaleidoscope.backend.blogs.dto.request.BlogCreateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogCreationResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogDetailResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogMediaResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogTagResponseDTO;
import com.kaleidoscope.backend.blogs.model.Blog;
import com.kaleidoscope.backend.blogs.model.BlogMedia;
import com.kaleidoscope.backend.blogs.model.BlogTag;
import com.kaleidoscope.backend.blogs.repository.BlogRepository;
import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.CategoryResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.UserSummaryResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.shared.repository.CommentRepository;
import com.kaleidoscope.backend.shared.repository.ReactionRepository;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Component
public class BlogMapper {
    
    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private ReactionRepository reactionRepository;
    @Autowired
    private BlogRepository blogRepository;

    public Blog toEntity(BlogCreateRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        Blog blog = Blog.builder()
                .title(dto.getTitle())
                .body(dto.getBody())
                .summary(dto.getSummary())
                .build();
        // Handle blog tags
        if (dto.getBlogTagIds() != null) {
            for (Long tagId : dto.getBlogTagIds()) {
                Blog taggedBlog = blogRepository.findById(tagId).orElse(null);
                if (taggedBlog != null) {
                    BlogTag blogTag = BlogTag.builder()
                            .taggingBlog(blog)
                            .taggedBlog(taggedBlog)
                            .build();
                    blog.getTaggedBlogs().add(blogTag);
                }
            }
        }
        return blog;
    }

    public BlogCreationResponseDTO toDTO(Blog blog) {
        if (blog == null) {
            return null;
        }

        User user = blog.getUser();
        UserSummaryResponseDTO authorDto = user != null ? UserSummaryResponseDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .build() : null;

        Location location = blog.getLocation();
        LocationResponseDTO locationDto = null;
        if (location != null) {
            locationDto = LocationResponseDTO.builder()
                    .locationId(location.getLocationId())
                    .name(location.getName())
                    .latitude(location.getLatitude())
                    .longitude(location.getLongitude())
                    .address(location.getAddress())
                    .build();
        }

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
                .categories(blog.getCategories().stream()
                        .map(bc -> {
                            Category cat = bc.getCategory();
                            return CategoryResponseDTO.builder()
                                    .categoryId(cat.getCategoryId())
                                    .name(cat.getName())
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .media(blog.getMedia().stream()
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
                        .collect(Collectors.toList()))
                .location(locationDto)
                .blogTags(blog.getTaggedBlogs().stream()
                        .map(tag -> BlogTagResponseDTO.builder()
                                .blogId(tag.getTaggedBlog().getBlogId())
                                .title(tag.getTaggedBlog().getTitle())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    public BlogDetailResponseDTO toBlogDetailDTO(Blog blog, ReactionType currentUserReaction) {
        if (blog == null) {
            return null;
        }

        User user = blog.getUser();
        UserSummaryResponseDTO authorDto = user != null ? UserSummaryResponseDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .build() : null;

        User reviewer = blog.getReviewer();
        UserSummaryResponseDTO reviewerDto = reviewer != null ? UserSummaryResponseDTO.builder()
                .userId(reviewer.getUserId())
                .username(reviewer.getUsername())
                .build() : null;

        Location location = blog.getLocation();
        LocationResponseDTO locationDto = null;
        if (location != null) {
            locationDto = LocationResponseDTO.builder()
                    .locationId(location.getLocationId())
                    .name(location.getName())
                    .latitude(location.getLatitude())
                    .longitude(location.getLongitude())
                    .address(location.getAddress())
                    .build();
        }

        // Get reaction and comment counts
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
                .categories(blog.getCategories().stream()
                        .map(bc -> {
                            Category cat = bc.getCategory();
                            return CategoryResponseDTO.builder()
                                    .categoryId(cat.getCategoryId())
                                    .name(cat.getName())
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .media(blog.getMedia().stream()
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
                        .collect(Collectors.toList()))
                .location(locationDto)
                .reactionCount(reactionCount)
                .commentCount(commentCount)
                .tags(blog.getTaggedBlogs().stream()
                        .map(tag -> BlogTagResponseDTO.builder()
                                .blogId(tag.getTaggedBlog().getBlogId())
                                .title(tag.getTaggedBlog().getTitle())
                                .build())
                        .collect(Collectors.toList()))
                .currentUserReaction(currentUserReaction)
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

    public void updateEntityFromDTO(Blog blog, BlogUpdateRequestDTO dto) {
        if (blog == null || dto == null) return;
        blog.setTitle(dto.getTitle());
        blog.setBody(dto.getBody());
        blog.setSummary(dto.getSummary());
        // You may want to update location, categories, media, etc. here as well
        // Update blog tags
        blog.getTaggedBlogs().clear();
        if (dto.getBlogTagIds() != null) {
            for (Long tagId : dto.getBlogTagIds()) {
                Blog taggedBlog = blogRepository.findById(tagId).orElse(null);
                if (taggedBlog != null) {
                    BlogTag blogTag = BlogTag.builder()
                            .taggingBlog(blog)
                            .taggedBlog(taggedBlog)
                            .build();
                    blog.getTaggedBlogs().add(blogTag);
                }
            }
        }
    }
}
