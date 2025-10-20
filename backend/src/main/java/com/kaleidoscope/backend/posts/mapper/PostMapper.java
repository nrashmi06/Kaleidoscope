package com.kaleidoscope.backend.posts.mapper;

import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCreationResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostDetailResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostMediaResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.posts.service.PostViewService;
import com.kaleidoscope.backend.shared.dto.response.CategorySummaryResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.shared.mapper.UserTagMapper;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Hashtag;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.shared.repository.CommentRepository;
import com.kaleidoscope.backend.shared.repository.ReactionRepository;
import com.kaleidoscope.backend.shared.repository.UserTagRepository;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Component
public class PostMapper {
    @Autowired
    private UserTagRepository userTagRepository;
    @Autowired
    private UserTagMapper userTagMapper;
    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private ReactionRepository reactionRepository;
    @Autowired
    private PostViewService postViewService;

    public Post toEntity(PostCreateRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        return Post.builder()
                .title(dto.title())
                .body(dto.body())
                .summary(dto.summary())
                .visibility(dto.visibility())
                .build();
    }

    public PostCreationResponseDTO toDTO(Post post) {
        if (post == null) {
            return null;
        }

        User user = post.getUser();
        UserDetailsSummaryResponseDTO authorDto = user != null ? new UserDetailsSummaryResponseDTO(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                user.getAccountStatus().name(),
                user.getProfilePictureUrl()
        ) : null;

        Location location = post.getLocation();
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

        List<UserTagResponseDTO> taggedUsers = userTagRepository.findByContentTypeAndContentId(ContentType.POST, post.getPostId(), Pageable.unpaged())
            .stream()
            .map(userTagMapper::toDTO)
            .collect(Collectors.toList());
        return PostCreationResponseDTO.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .body(post.getBody())
                .summary(post.getSummary())
                .visibility(post.getVisibility())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .author(authorDto)
                .categories(post.getCategories().stream()
                        .map(pc -> {
                            Category cat = pc.getCategory();
                            return new CategorySummaryResponseDTO(
                                    cat.getCategoryId(),
                                    cat.getName()
                            );
                        })
                        .collect(Collectors.toList()))
                .media(post.getMedia().stream()
                        .sorted(Comparator.comparing(PostMedia::getPosition))
                        .map(pm -> PostMediaResponseDTO.builder()
                                .mediaId(pm.getMediaId())
                                .mediaUrl(pm.getMediaUrl())
                                .mediaType(pm.getMediaType())
                                .position(pm.getPosition())
                                .width(pm.getWidth())
                                .height(pm.getHeight())
                                .fileSizeKb(pm.getFileSizeKb())
                                .durationSeconds(pm.getDurationSeconds())
                                .extraMetadata(pm.getExtraMetadata())
                                .createdAt(pm.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .location(locationDto)
                .taggedUsers(taggedUsers)
                .build();
    }

    public List<PostMedia> toPostMediaEntities(List<MediaUploadRequestDTO> mediaDtos) {
        if (mediaDtos == null) {
            return List.of();
        }
        AtomicInteger autoPosition = new AtomicInteger(0);
        return mediaDtos.stream().map(mediaDto -> PostMedia.builder()
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

    public PostDetailResponseDTO toPostDetailDTO(Post post, ReactionType currentUserReaction) {
        if (post == null) {
            return null;
        }

        User user = post.getUser();
        UserDetailsSummaryResponseDTO authorDto = user != null ? new UserDetailsSummaryResponseDTO(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                user.getAccountStatus().name(),
                user.getProfilePictureUrl()
        ) : null;

        Location location = post.getLocation();
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

        List<UserTagResponseDTO> taggedUsers = userTagRepository.findByContentTypeAndContentId(ContentType.POST, post.getPostId(), Pageable.unpaged())
                .stream()
                .map(userTagMapper::toDTO)
                .collect(Collectors.toList());

        // Extract hashtag names from post
        List<String> hashtagNames = post.getHashtags().stream()
                .map(Hashtag::getName)
                .sorted()
                .collect(Collectors.toList());

        // Get reaction and comment counts
        long reactionCount = reactionRepository.countByContentIdAndContentType(post.getPostId(), ContentType.POST);
        long commentCount = commentRepository.countByContentIdAndContentType(post.getPostId(), ContentType.POST);
        long viewCount = postViewService.getViewCount(post.getPostId()); // Get Redis-optimized view count

        return PostDetailResponseDTO.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .body(post.getBody())
                .summary(post.getSummary())
                .visibility(post.getVisibility())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .author(authorDto)
                .categories(post.getCategories().stream()
                        .map(pc -> {
                            Category cat = pc.getCategory();
                            return new CategorySummaryResponseDTO(
                                    cat.getCategoryId(),
                                    cat.getName()
                            );
                        })
                        .collect(Collectors.toList()))
                .media(post.getMedia().stream()
                        .sorted(Comparator.comparing(PostMedia::getPosition))
                        .map(pm -> PostMediaResponseDTO.builder()
                                .mediaId(pm.getMediaId())
                                .mediaUrl(pm.getMediaUrl())
                                .mediaType(pm.getMediaType())
                                .position(pm.getPosition())
                                .width(pm.getWidth())
                                .height(pm.getHeight())
                                .fileSizeKb(pm.getFileSizeKb())
                                .durationSeconds(pm.getDurationSeconds())
                                .extraMetadata(pm.getExtraMetadata())
                                .createdAt(pm.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .location(locationDto)
                .taggedUsers(taggedUsers)
                .hashtags(hashtagNames)
                .reactionCount(reactionCount)
                .commentCount(commentCount)
                .viewCount(viewCount) // Add view count to response
                .currentUserReaction(currentUserReaction)
                .build();
    }

    public PostSummaryResponseDTO toPostSummaryDTO(Post post) {
        if (post == null) {
            return null;
        }

        User user = post.getUser();
        UserDetailsSummaryResponseDTO authorDto = user != null ? new UserDetailsSummaryResponseDTO(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                user.getAccountStatus().name(),
                user.getProfilePictureUrl()
        ) : null;

        // Find thumbnail URL from media with lowest position
        String thumbnailUrl = post.getMedia().stream()
                .min(Comparator.comparing(PostMedia::getPosition))
                .map(PostMedia::getMediaUrl)
                .orElse(null);

        // Extract hashtag names from post
        List<String> hashtagNames = post.getHashtags().stream()
                .map(Hashtag::getName)
                .sorted()
                .collect(Collectors.toList());

        // Get reaction and comment counts
        long reactionCount = reactionRepository.countByContentIdAndContentType(post.getPostId(), ContentType.POST);
        long commentCount = commentRepository.countByContentIdAndContentType(post.getPostId(), ContentType.POST);
        long viewCount = postViewService.getViewCount(post.getPostId()); // Get Redis-optimized view count

        return PostSummaryResponseDTO.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .summary(post.getSummary())
                .visibility(post.getVisibility())
                .createdAt(post.getCreatedAt())
                .author(authorDto)
                .categories(post.getCategories().stream()
                        .map(pc -> {
                            Category cat = pc.getCategory();
                            return new CategorySummaryResponseDTO(
                                    cat.getCategoryId(),
                                    cat.getName()
                            );
                        })
                        .collect(Collectors.toList()))
                .thumbnailUrl(thumbnailUrl)
                .hashtags(hashtagNames)
                .reactionCount(reactionCount)
                .commentCount(commentCount)
                .viewCount(viewCount) // Add view count to response
                .build();
    }

    /**
     * Overloaded method to map PostDocument directly to PostSummaryResponseDTO
     * Uses denormalized data from Elasticsearch, avoiding database calls for better performance
     */
    public PostSummaryResponseDTO toPostSummaryDTO(PostDocument document) {
        if (document == null) {
            return null;
        }

        // Map author from denormalized document data
        UserDetailsSummaryResponseDTO authorDto = null;
        if (document.getAuthor() != null) {
            PostDocument.Author author = document.getAuthor();
            authorDto = new UserDetailsSummaryResponseDTO(
                    author.getUserId(),
                    author.getEmail(),
                    author.getUsername(),
                    author.getAccountStatus(),
                    author.getProfilePictureUrl()
            );
        }

        // Map categories from denormalized document data
        List<CategorySummaryResponseDTO> categoryDtos = List.of();
        if (document.getCategories() != null) {
            categoryDtos = document.getCategories().stream()
                    .map(cat -> new CategorySummaryResponseDTO(
                            cat.getCategoryId(),
                            cat.getName()
                    ))
                    .collect(Collectors.toList());
        }

        // Map hashtags from denormalized document data
        List<String> hashtags = document.getHashtags() != null ? document.getHashtags() : List.of();

        return PostSummaryResponseDTO.builder()
                .postId(document.getPostId())
                .title(document.getTitle())
                .summary(document.getSummary())
                .visibility(document.getVisibility())
                .createdAt(document.getCreatedAt())
                .author(authorDto)
                .categories(categoryDtos)
                .thumbnailUrl(document.getThumbnailUrl())
                .hashtags(hashtags)
                .reactionCount(document.getReactionCount())
                .commentCount(document.getCommentCount())
                .viewCount(document.getViewCount()) // Use denormalized view count directly
                .build();
    }
}
