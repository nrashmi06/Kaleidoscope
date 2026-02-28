package com.kaleidoscope.backend.users.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_notification_preferences")
@Getter
@Setter
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
    @Builder.Default
    private Boolean likesEmail = true;

    @Column(name = "likes_push")
    @Builder.Default
    private Boolean likesPush = true;

    @Column(name = "comments_email")
    @Builder.Default
    private Boolean commentsEmail = true;

    @Column(name = "comments_push")
    @Builder.Default
    private Boolean commentsPush = true;

    @Column(name = "follows_email")
    @Builder.Default
    private Boolean followsEmail = true;

    @Column(name = "follows_push")
    @Builder.Default
    private Boolean followsPush = true;

    @Column(name = "mentions_email")
    @Builder.Default
    private Boolean mentionsEmail = true;

    @Column(name = "mentions_push")
    @Builder.Default
    private Boolean mentionsPush = true;

    @Column(name = "system_email")
    @Builder.Default
    private Boolean systemEmail = true;

    @Column(name = "system_push")
    @Builder.Default
    private Boolean systemPush = true;

    @Column(name = "follow_request_push")
    @Builder.Default
    private Boolean followRequestPush = true;

    @Column(name = "follow_accept_push")
    @Builder.Default
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserNotificationPreferences that = (UserNotificationPreferences) o;
        return preferenceId != null && preferenceId.equals(that.preferenceId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}