package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.PostReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostReactionRepository extends JpaRepository<PostReaction, Long> {

    @Query("SELECT r.reactionType, COUNT(r) FROM PostReaction r WHERE r.post.postId = :postId GROUP BY r.reactionType")
    List<Object[]> countReactionsByPostIdGroupedByType(@Param("postId") Long postId);

    /**
     * Soft-deletes all reactions associated with a specific post by setting their
     * deleted_at timestamp. This is triggered when a post is soft-deleted.
     *
     * @param postId The ID of the post whose reactions should be soft-deleted.
     */
    @Modifying
    @Query("UPDATE PostReaction r SET r.deletedAt = :deletedAt WHERE r.post.postId = :postId")
    void softDeleteReactionsByPostId(@Param("postId") Long postId, @Param("deletedAt") LocalDateTime deletedAt);

    @Query("SELECT r FROM PostReaction r WHERE r.post.postId = :postId AND r.user.userId = :userId")
    Optional<PostReaction> findByPostIdAndUserId(@Param("postId") Long postId, @Param("userId") Long userId);

    @Query(value = "SELECT * FROM reactions r WHERE r.post_id = :postId AND r.user_id = :userId ORDER BY r.reaction_id DESC LIMIT 1", nativeQuery = true)
    Optional<PostReaction> findAnyByPostIdAndUserIdIncludeDeleted(@Param("postId") Long postId, @Param("userId") Long userId);
}


