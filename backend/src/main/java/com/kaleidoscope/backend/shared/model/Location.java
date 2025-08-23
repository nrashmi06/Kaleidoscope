package com.kaleidoscope.backend.shared.model;

import com.kaleidoscope.backend.posts.model.Post;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "locations")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "location_id")
    private Long locationId;

    @Column(nullable = false, length = 255)
    private String name;

    // Use BigDecimal for precision with geographical coordinates
    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(length = 100)
    private String country;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String city;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "place_id", length = 255)
    private String placeId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Relationship to Posts (optional, but good for navigation)
    @OneToMany(mappedBy = "location", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Post> posts = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Location location = (Location) o;
        return locationId != null && locationId.equals(location.locationId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}