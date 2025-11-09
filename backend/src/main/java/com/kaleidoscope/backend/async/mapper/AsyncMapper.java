package com.kaleidoscope.backend.async.mapper;

import com.kaleidoscope.backend.async.dto.ProfilePictureEventDTO;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Mapper for async event DTOs and Maps used for Redis Stream publishing
 * Migrated from various ServiceImpl classes
 */
@Component
public class AsyncMapper {

    /**
     * Create ProfilePictureEventDTO for Redis Stream publishing
     * Migrated from UserServiceImpl.updateUserProfile and UserRegistrationServiceImpl.publishProfilePictureEvent
     */
    public static ProfilePictureEventDTO toProfilePictureEventDTO(Long userId, String imageUrl) {
        return ProfilePictureEventDTO.builder()
                .userId(userId)
                .imageUrl(imageUrl)
                .correlationId(MDC.get("correlationId"))
                .build();
    }

    /**
     * Create user profile sync event payload for Redis Stream
     * Migrated from UserServiceImpl.updateUserProfile
     */
    public static Map<String, Object> toUserProfileSyncPayload(Long userId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("correlationId", MDC.get("correlationId"));
        return payload;
    }

    /**
     * Create hashtag usage update event for Redis Stream
     * Migrated from HashtagServiceImpl.triggerHashtagUsageUpdate
     */
    public static Map<String, Object> toHashtagUsageEvent(String hashtagName, int change) {
        Map<String, Object> event = new HashMap<>();
        event.put("hashtagName", hashtagName.toLowerCase());
        event.put("change", change);
        event.put("timestamp", System.currentTimeMillis());
        event.put("correlationId", MDC.get("correlationId"));
        return event;
    }
}
