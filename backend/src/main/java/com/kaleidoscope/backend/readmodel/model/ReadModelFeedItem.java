package com.kaleidoscope.backend.readmodel.model;

import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.users.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "read_model_feed_items")  // Removed indexes - PostgreSQL is backup only
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadModelFeedItem {

    @Id
    @Column(name = "media_id")
    private Long mediaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id")
    private User uploader;

    @Column(name = "media_url")
    private String mediaUrl;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(name = "reaction_count")
    @Builder.Default
    private Integer reactionCount = 0;

    @Column(name = "comment_count")
    @Builder.Default
    private Integer commentCount = 0;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ReadModelFeedItem that = (ReadModelFeedItem) o;
        return mediaId != null && mediaId.equals(that.mediaId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
