package com.kaleidoscope.backend.readmodels.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
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
}

