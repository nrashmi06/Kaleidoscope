package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {


    @Query("SELECT r.reactionType, COUNT(r) FROM Reaction r WHERE r.post.postId = :postId GROUP BY r.reactionType")
    List<Object[]> countReactionsByPostIdGroupedByType(@Param("postId") Long postId);

    /**
     * Soft-deletes all reactions associated with a specific post by setting their
     * deleted_at timestamp. This is triggered when a post is soft-deleted.
     *
     * @param postId The ID of the post whose reactions should be soft-deleted.
     */
    // ReactionRepository.java
    @Modifying
    @Query("UPDATE Reaction r SET r.deletedAt = :deletedAt WHERE r.post.postId = :postId")
    void softDeleteReactionsByPostId(@Param("postId") Long postId, @Param("deletedAt") java.time.LocalDateTime deletedAt);
}