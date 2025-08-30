package com.kaleidoscope.backend.posts.mapper;

import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.CategoryResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostMediaResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCreationResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.UserSummaryResponseDTO;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.mapper.UserTagMapper;
import com.kaleidoscope.backend.shared.repository.UserTagRepository;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
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
        UserSummaryResponseDTO authorDto = user != null ? UserSummaryResponseDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
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
                            return CategoryResponseDTO.builder()
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
}