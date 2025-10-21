package com.kaleidoscope.backend.shared.mapper;

import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.model.UserTag;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserTagMapper {
    
    public UserTagResponseDTO toDTO(UserTag userTag) {
        if (userTag == null) {
            return null;
        }
        
        return UserTagResponseDTO.builder()
                .tagId(userTag.getTagId())
                .taggedUserId(userTag.getTaggedUser().getUserId())
                .taggedUsername(userTag.getTaggedUser().getUsername())
                .taggerUserId(userTag.getTaggerUser().getUserId())
                .taggerUsername(userTag.getTaggerUser().getUsername())
                .contentType(userTag.getContentType())
                .contentId(userTag.getContentId())
                .createdAt(userTag.getCreatedAt())
                .build();
    }

    /**
     * Create UserTag entity
     * Migrated from UserTagServiceImpl.createUserTag
     */
    public static UserTag toEntity(User taggedUser, User taggerUser, ContentType contentType, Long contentId) {
        return UserTag.builder()
                .taggedUser(taggedUser)
                .taggerUser(taggerUser)
                .contentType(contentType)
                .contentId(contentId)
                .build();
    }
}
