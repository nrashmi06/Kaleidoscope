package com.kaleidoscope.backend.notifications.service;

import com.kaleidoscope.backend.notifications.dto.response.NotificationResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    
    Page<NotificationResponseDTO> getNotifications(Boolean isReadFilter, Pageable pageable);
    
    long getUnreadCount();
    
    NotificationResponseDTO markAsRead(Long notificationId);
    
    int markAllAsRead();
    
    void deleteNotification(Long notificationId);
}

