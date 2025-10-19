package com.kaleidoscope.backend.users.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_notification_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "preference_id")
    private Long preferenceId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "likes_email")
    private Boolean likesEmail = true;

    @Column(name = "likes_push")
    private Boolean likesPush = true;

    @Column(name = "comments_email")
    private Boolean commentsEmail = true;

    @Column(name = "comments_push")
    private Boolean commentsPush = true;

    @Column(name = "follows_email")
    private Boolean followsEmail = true;

    @Column(name = "follows_push")
    private Boolean followsPush = true;

    @Column(name = "mentions_email")
    private Boolean mentionsEmail = true;

    @Column(name = "mentions_push")
    private Boolean mentionsPush = true;

    @Column(name = "system_email")
    private Boolean systemEmail = true;

    @Column(name = "system_push")
    private Boolean systemPush = true;

    @Column(name = "follow_request_push")
    private Boolean followRequestPush = true;

    @Column(name = "follow_accept_push")
    private Boolean followAcceptPush = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}