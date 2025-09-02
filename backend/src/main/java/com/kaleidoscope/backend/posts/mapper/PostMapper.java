package com.kaleidoscope.backend.posts.mapper;

import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CategorySummaryResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostMediaResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCreationResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostDetailResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.UserSummaryResponseDTO;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.shared.mapper.UserTagMapper;
import com.kaleidoscope.backend.shared.repository.UserTagRepository;
import com.kaleidoscope.backend.shared.repository.CommentRepository;
import com.kaleidoscope.backend.shared.repository.ReactionRepository;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
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

    public Post toEntity(PostCreateRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        return Post.builder()
                .title(dto.getTitle())
                .body(dto.getBody())
                .summary(dto.getSummary())
                .visibility(dto.getVisibility())
                .build();
    }

    public PostCreationResponseDTO toDTO(Post post) {
        if (post == null) {
            return null;
        }

        User user = post.getUser();
        UserDetailsSummaryResponseDTO authorDto = user != null ? UserDetailsSummaryResponseDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accountStatus(user.getAccountStatus().name())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build() : null;

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
                            return CategorySummaryResponseDTO.builder()
                                    .categoryId(cat.getCategoryId())
                                    .name(cat.getName())
                                    .build();
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

    public PostDetailResponseDTO toPostDetailDTO(Post post, ReactionType currentUserReaction) {
        if (post == null) {
            return null;
        }

        User user = post.getUser();
        UserDetailsSummaryResponseDTO authorDto = user != null ? UserDetailsSummaryResponseDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accountStatus(user.getAccountStatus().name())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build() : null;

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

        // Get reaction and comment counts
        long reactionCount = reactionRepository.countByContentIdAndContentType(post.getPostId(), ContentType.POST);
        long commentCount = commentRepository.countByContentIdAndContentType(post.getPostId(), ContentType.POST);

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
                            return CategorySummaryResponseDTO.builder()
                                    .categoryId(cat.getCategoryId())
                                    .name(cat.getName())
                                    .build();
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
                .reactionCount(reactionCount)
                .commentCount(commentCount)
                .currentUserReaction(currentUserReaction)
                .build();
    }

    public PostSummaryResponseDTO toPostSummaryDTO(Post post) {
        if (post == null) {
            return null;
        }

        User user = post.getUser();
        UserDetailsSummaryResponseDTO authorDto = user != null ? UserDetailsSummaryResponseDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accountStatus(user.getAccountStatus().name())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build() : null;

        // Find thumbnail URL from media with lowest position
        String thumbnailUrl = post.getMedia().stream()
                .min(Comparator.comparing(PostMedia::getPosition))
                .map(PostMedia::getMediaUrl)
                .orElse(null);

        // Get reaction and comment counts
        long reactionCount = reactionRepository.countByContentIdAndContentType(post.getPostId(), ContentType.POST);
        long commentCount = commentRepository.countByContentIdAndContentType(post.getPostId(), ContentType.POST);

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
                            return CategorySummaryResponseDTO.builder()
                                    .categoryId(cat.getCategoryId())
                                    .name(cat.getName())
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .thumbnailUrl(thumbnailUrl)
                .reactionCount(reactionCount)
                .commentCount(commentCount)
                .build();
    }
}