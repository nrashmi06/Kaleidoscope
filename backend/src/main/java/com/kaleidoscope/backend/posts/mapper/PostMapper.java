package com.kaleidoscope.backend.posts.mapper;

import com.kaleidoscope.backend.posts.dto.request.MediaUploadRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.CategoryResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostMediaResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.UserResponseDTO;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class PostMapper {

    public Post toEntity(PostCreateRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        return Post.builder()
                .title(dto.getTitle())
                .body(dto.getBody())
                .summary(dto.getSummary())
                .visibility(dto.getVisibility())
                .type(dto.getType() != null ? dto.getType() : com.kaleidoscope.backend.posts.enums.PostType.SOCIAL)
                .build();
    }

    public PostResponseDTO toDTO(Post post) {
        if (post == null) {
            return null;
        }

        User user = post.getUser();
        UserResponseDTO authorDto = user != null ? UserResponseDTO.builder()
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

        return PostResponseDTO.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .body(post.getBody())
                .summary(post.getSummary())
                .wordCount(post.getWordCount())
                .readTimeMinutes(post.getReadTimeMinutes())
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
                        .collect(java.util.stream.Collectors.toList()))
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
                        .collect(java.util.stream.Collectors.toList()))
                .location(locationDto)
                .type(post.getType())
                .build();
    }

    /**
     * Maps a list of MediaUploadRequestDTO to a set of PostMedia entities.
     * Uses client-provided position if available, otherwise auto-increments.
     */
    public List<PostMedia> toPostMediaEntities(List<MediaUploadRequestDTO> mediaDtos) {
        AtomicInteger autoPosition = new AtomicInteger(0);
        return mediaDtos.stream().map(mediaDto -> {
            String url = mediaDto.getUrl();
            Integer position = mediaDto.getPosition() != null ? mediaDto.getPosition() : autoPosition.getAndIncrement();
            return PostMedia.builder()
                    .mediaUrl(url)
                    .mediaType(mediaDto.getMediaType())
                    .position(position)
                    .width(mediaDto.getWidth())
                    .height(mediaDto.getHeight())
                    .fileSizeKb(mediaDto.getFileSizeKb())
                    .durationSeconds(mediaDto.getDurationSeconds())
                    .extraMetadata(mediaDto.getExtraMetadata())
                    .build();
        }).toList();
    }
}