package com.kaleidoscope.backend.notifications.repository;

import com.kaleidoscope.backend.notifications.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    Page<Notification> findByRecipientUserUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    Long countByRecipientUserUserIdAndIsReadFalse(Long userId);
}

