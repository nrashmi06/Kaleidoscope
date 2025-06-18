package com.kaleidoscope.backend.users.model;

import com.kaleidoscope.backend.users.enums.Theme;
import com.kaleidoscope.backend.users.enums.Visibility;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "preference_id")
    private Long preferenceId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Theme theme = Theme.SYSTEM;

    @Column(nullable = false, length = 10)
    private String language = "en-US";

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_visibility")
    private Visibility profileVisibility = Visibility.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "allow_messages")
    private Visibility allowMessages = Visibility.FRIENDS_ONLY;

    @Enumerated(EnumType.STRING)
    @Column(name = "allow_tagging")
    private Visibility allowTagging = Visibility.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "view_activity")
    private Visibility viewActivity = Visibility.FRIENDS_ONLY;

    @Column(name = "show_email")
    private Boolean showEmail = false;

    @Column(name = "show_phone")
    private Boolean showPhone = false;

    @Column(name = "show_online_status")
    private Boolean showOnlineStatus = true;

    @Column(name = "search_discoverable")
    private Boolean searchDiscoverable = true;

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