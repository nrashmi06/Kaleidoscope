package com.kaleidoscope.backend.readmodel.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "read_model_user_profiles")  // Removed indexes - PostgreSQL is backup only
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadModelUserProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "profile_info", columnDefinition = "jsonb")
    private Map<String, Object> profileInfo;

    @Column(name = "follower_count")
    @Builder.Default
    private Integer followerCount = 0;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "interests", columnDefinition = "text[]")
    private String[] interests;

    @Column(name = "face_embedding", columnDefinition = "vector(1024)")
    private String faceEmbedding;

    @LastModifiedDate
    @Column(name = "last_updated", nullable = false)
    private OffsetDateTime lastUpdated;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ReadModelUserProfile that = (ReadModelUserProfile) o;
        return userId != null && userId.equals(that.userId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
