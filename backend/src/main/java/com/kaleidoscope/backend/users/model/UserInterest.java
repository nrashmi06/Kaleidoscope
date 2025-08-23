package com.kaleidoscope.backend.users.model;

import com.kaleidoscope.backend.shared.model.Category;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_interests",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "category_id"}))
@Getter // Use Getter
@Setter // Use Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interest_id")
    private Long interestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Override equals and hashCode to avoid issues with lazy loading
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserInterest that = (UserInterest) o;
        return interestId != null && interestId.equals(that.interestId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}