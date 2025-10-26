package com.kaleidoscope.backend.notifications.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface NotificationSseService {

    SseEmitter createEmitter(Long userId);

    void removeEmitter(Long userId);

    void sendCountUpdate(Long userId, Long count);
}

