package com.kaleidoscope.backend.shared.model;

import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.users.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_tags",
    uniqueConstraints = @UniqueConstraint(columnNames = {"tagged_user_id", "content_type", "content_id"}),
    indexes = {
        @Index(columnList = "content_type, content_id"),
        @Index(columnList = "tagged_user_id")
    }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private Long tagId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tagged_user_id", nullable = false)
    private User taggedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tagger_user_id", nullable = false)
    private User taggerUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false)
    private ContentType contentType;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserTag userTag = (UserTag) o;
        return tagId != null && tagId.equals(userTag.tagId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}

