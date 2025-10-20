package com.kaleidoscope.backend.shared.mapper;

import com.kaleidoscope.backend.shared.dto.response.HashtagResponseDTO;
import com.kaleidoscope.backend.shared.model.Hashtag;
import org.springframework.stereotype.Component;

@Component
public class HashtagMapper {

    public HashtagResponseDTO toResponseDTO(Hashtag hashtag) {
        if (hashtag == null) {
            return null;
        }

        return HashtagResponseDTO.builder()
                .hashtagId(hashtag.getHashtagId())
                .name(hashtag.getName())
                .usageCount(hashtag.getUsageCount())
                .build();
    }
}
