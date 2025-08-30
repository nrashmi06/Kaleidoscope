package com.kaleidoscope.backend.shared.mapper;

import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.shared.model.UserTag;
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
}
