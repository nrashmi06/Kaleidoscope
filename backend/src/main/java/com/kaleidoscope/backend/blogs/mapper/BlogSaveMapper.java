package com.kaleidoscope.backend.blogs.mapper;

import com.kaleidoscope.backend.blogs.dto.response.BlogSaveResponseDTO;
import com.kaleidoscope.backend.blogs.model.Blog;
import com.kaleidoscope.backend.blogs.model.BlogSave;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Mapper for BlogSave entity and related DTOs
 * Migrated from PostSaveMapper
 */
@Component
public class BlogSaveMapper {

    /**
     * Create BlogSave entity
     * Migrated from PostSaveMapper.toEntity
     */
    public static BlogSave toEntity(Blog blog, User user) {
        return BlogSave.builder()
                .blog(blog)
                .user(user)
                .build();
    }

    /**
     * Create BlogSaveResponseDTO
     * Migrated from PostSaveMapper.toResponseDTO
     */
    public static BlogSaveResponseDTO toResponseDTO(Optional<BlogSave> userSave, long totalSaves) {
        return new BlogSaveResponseDTO(
                userSave.isPresent(),
                totalSaves,
                userSave.map(BlogSave::getCreatedAt).orElse(null)
        );
    }
}

