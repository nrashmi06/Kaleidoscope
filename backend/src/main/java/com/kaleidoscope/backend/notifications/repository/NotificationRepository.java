package com.kaleidoscope.backend.notifications.repository;

import com.kaleidoscope.backend.notifications.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    Page<Notification> findByRecipientUserUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    Page<Notification> findByRecipientUserUserIdAndIsRead(Long userId, Boolean isRead, Pageable pageable);

    Long countByRecipientUserUserIdAndIsReadFalse(Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipientUser.userId = :userId AND n.isRead = false")
    int markAllAsReadForUser(@Param("userId") Long userId);
}
