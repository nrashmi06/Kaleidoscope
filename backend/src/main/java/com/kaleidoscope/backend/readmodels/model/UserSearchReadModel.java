package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "read_model_user_search")
public class UserSearchReadModel {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "department")
    private String department;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "total_posts")
    private Integer totalPosts;

    @Column(name = "total_followers")
    private Integer totalFollowers;

    @Column(name = "face_enrolled")
    private Boolean faceEnrolled;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserSearchReadModel that = (UserSearchReadModel) o;
        return userId != null && userId.equals(that.userId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
