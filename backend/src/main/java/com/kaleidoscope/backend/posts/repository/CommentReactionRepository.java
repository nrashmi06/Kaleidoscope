package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.CommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {

    @Query("SELECT r.reactionType, COUNT(r) FROM CommentReaction r WHERE r.comment.commentId = :commentId GROUP BY r.reactionType")
    List<Object[]> countReactionsByCommentIdGroupedByType(@Param("commentId") Long commentId);

    @Modifying
    @Query("UPDATE CommentReaction r SET r.deletedAt = :deletedAt WHERE r.comment.commentId = :commentId")
    void softDeleteReactionsByCommentId(@Param("commentId") Long commentId, @Param("deletedAt") LocalDateTime deletedAt);

    @Query("SELECT r FROM CommentReaction r WHERE r.comment.commentId = :commentId AND r.user.userId = :userId")
    Optional<CommentReaction> findByCommentIdAndUserId(@Param("commentId") Long commentId, @Param("userId") Long userId);

    @Query(value = "SELECT * FROM comment_reactions r WHERE r.comment_id = :commentId AND r.user_id = :userId ORDER BY r.reaction_id DESC LIMIT 1", nativeQuery = true)
    Optional<CommentReaction> findAnyByCommentIdAndUserIdIncludeDeleted(@Param("commentId") Long commentId, @Param("userId") Long userId);
}
