package com.kaleidoscope.backend.async.dto;

import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.NotificationType;

import java.util.Map;

public record NotificationEventDTO(
        NotificationType type,
        Long recipientUserId,
        Long actorUserId,
        Long contentId,
        ContentType contentType,
        Map<String, String> additionalData,
        String correlationId
) {}

