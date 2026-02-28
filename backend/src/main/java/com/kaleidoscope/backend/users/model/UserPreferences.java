package com.kaleidoscope.backend.users.model;

import com.kaleidoscope.backend.users.enums.Theme;
import com.kaleidoscope.backend.users.enums.Visibility;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
@Getter
@Setter
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
    @Builder.Default
    private Theme theme = Theme.SYSTEM;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String language = "en-US";

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_visibility")
    @Builder.Default
    private Visibility profileVisibility = Visibility.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "allow_messages")
    @Builder.Default
    private Visibility allowMessages = Visibility.FRIENDS_ONLY;

    @Enumerated(EnumType.STRING)
    @Column(name = "allow_tagging")
    @Builder.Default
    private Visibility allowTagging = Visibility.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "view_activity")
    @Builder.Default
    private Visibility viewActivity = Visibility.FRIENDS_ONLY;

    @Column(name = "show_email")
    @Builder.Default
    private Boolean showEmail = false;

    @Column(name = "show_phone")
    @Builder.Default
    private Boolean showPhone = false;

    @Column(name = "show_online_status")
    @Builder.Default
    private Boolean showOnlineStatus = true;

    @Column(name = "search_discoverable")
    @Builder.Default
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserPreferences that = (UserPreferences) o;
        return preferenceId != null && preferenceId.equals(that.preferenceId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}