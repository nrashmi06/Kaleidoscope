package com.kaleidoscope.backend.posts.model;

import com.kaleidoscope.backend.posts.enums.FaceDetectionStatus;
import com.kaleidoscope.backend.users.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "media_detected_faces") // Removed indexes - PostgreSQL is backup only
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaDetectedFace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", nullable = false)
    private MediaAiInsights mediaAiInsights;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "bbox", nullable = false, columnDefinition = "integer[]")
    private Integer[] bbox;

    @Column(nullable = false, columnDefinition = "vector(1024)")
    private String embedding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "identified_user_id")
    private User identifiedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suggested_user_id")
    private User suggestedUser;

    @Column(name = "confidence_score")
    private Float confidenceScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FaceDetectionStatus status = FaceDetectionStatus.UNIDENTIFIED;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MediaDetectedFace that = (MediaDetectedFace) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
