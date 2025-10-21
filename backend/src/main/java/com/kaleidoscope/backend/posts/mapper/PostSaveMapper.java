package com.kaleidoscope.backend.posts.mapper;

import com.kaleidoscope.backend.posts.dto.response.PostSaveResponseDTO;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostSave;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Mapper for PostSave entity and related DTOs
 * Migrated from PostSaveServiceImpl
 */
@Component
public class PostSaveMapper {

    /**
     * Create PostSave entity
     * Migrated from PostSaveServiceImpl.saveOrUnsavePost
     */
    public static PostSave toEntity(Post post, User user) {
        return PostSave.builder()
                .post(post)
                .user(user)
                .build();
    }

    /**
     * Create PostSaveResponseDTO
     * Migrated from PostSaveServiceImpl.buildResponse
     */
    public static PostSaveResponseDTO toResponseDTO(Optional<PostSave> userSave, long totalSaves) {
        return new PostSaveResponseDTO(
                userSave.isPresent(),
                totalSaves,
                userSave.map(PostSave::getCreatedAt).orElse(null)
        );
    }
}

