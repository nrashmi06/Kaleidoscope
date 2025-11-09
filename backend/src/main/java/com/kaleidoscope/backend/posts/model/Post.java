package com.kaleidoscope.backend.posts.model;

import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Hashtag;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.shared.model.PostHashtag;
import com.kaleidoscope.backend.shared.model.UserTag;
import com.kaleidoscope.backend.users.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "posts")
@EntityListeners(AuditingEntityListener.class)
@SQLDelete(sql = "UPDATE posts SET deleted_at = NOW() WHERE post_id = ?")
@Where(clause = "deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(length = 500)
    private String summary;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PostVisibility visibility = PostVisibility.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PostStatus status = PostStatus.PUBLISHED;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<PostMedia> media = new HashSet<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<PostCategory> categories = new HashSet<>();

    // Using the shared UserTag entity instead of a specific PostTag
    // Read-only relationship - UserTags are managed through UserTagService
    // This prevents Hibernate from trying to set content_id to NULL on Post deletion
    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", referencedColumnName = "post_id", insertable = false, updatable = false)
    @Where(clause = "content_type = 'POST'")
    @Builder.Default
    private Set<UserTag> userTags = new HashSet<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<PostHashtag> postHashtags = new HashSet<>();

    public void addMedia(PostMedia mediaItem) {
        media.add(mediaItem);
        mediaItem.setPost(this);
    }

    public void removeMedia(PostMedia mediaItem) {
        media.remove(mediaItem);
        mediaItem.setPost(null);
    }

    public void addCategory(Category category) {
        PostCategory postCategory = new PostCategory(this, category);
        categories.add(postCategory);
    }

    public void removeCategory(Category category) {
        PostCategory toRemove = this.categories.stream()
                .filter(pc -> pc.getCategory().equals(category) && pc.getPost().equals(this))
                .findFirst()
                .orElse(null);

        if (toRemove != null) {
            this.categories.remove(toRemove);
            toRemove.setPost(null);
        }
    }

    public void addUserTag(User taggerUser, User taggedUser) {
        UserTag userTag = UserTag.builder()
                .taggerUser(taggerUser)
                .taggedUser(taggedUser)
                .contentType(com.kaleidoscope.backend.shared.enums.ContentType.POST)
                .contentId(this.postId)
                .build();
        userTags.add(userTag);
    }

    public void removeUserTag(User taggedUser) {
        UserTag toRemove = this.userTags.stream()
                .filter(ut -> ut.getTaggedUser().equals(taggedUser) &&
                             ut.getContentId().equals(this.postId) &&
                             ut.getContentType() == com.kaleidoscope.backend.shared.enums.ContentType.POST)
                .findFirst()
                .orElse(null);

        if (toRemove != null) {
            this.userTags.remove(toRemove);
        }
    }

    /**
     * Helper method to get Hashtag entities directly from PostHashtag relationships
     * @return Set of Hashtag entities associated with this post
     */
    public Set<Hashtag> getHashtags() {
        return this.postHashtags.stream()
                .map(PostHashtag::getHashtag)
                .collect(java.util.stream.Collectors.toSet());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Post post = (Post) o;
        return postId != null && postId.equals(post.postId);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}