package com.kaleidoscope.backend.users.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "follow_requests",
        uniqueConstraints = @UniqueConstraint(columnNames = {"requester_id", "requestee_id"}),
        indexes = {
                @Index(name = "idx_requestee_id", columnList = "requestee_id"),
                @Index(name = "idx_requester_id", columnList = "requester_id"),
                @Index(name = "idx_created_at", columnList = "created_at")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requestee_id", nullable = false)
    private User requestee;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

