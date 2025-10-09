package com.kaleidoscope.backend.shared.readmodel.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "read_model_recommendations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadModelRecommendation {

    @Id
    @Column(name = "media_id")
    private Long mediaId;

    @Column(name = "image_embedding", columnDefinition = "vector(512)")
    private String imageEmbedding;

    @Column(name = "media_url")
    private String mediaUrl;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ReadModelRecommendation that = (ReadModelRecommendation) o;
        return mediaId != null && mediaId.equals(that.mediaId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
