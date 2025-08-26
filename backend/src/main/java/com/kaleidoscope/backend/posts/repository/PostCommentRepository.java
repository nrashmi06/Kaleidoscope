package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    /**
     * Soft-deletes all comments associated with a specific post by setting their
     * deleted_at timestamp. While this is often handled by cascading from the Post
     * entity, this method provides an explicit way to perform the action.
     *
     * @param postId The ID of the post whose comments should be soft-deleted.
     */

    @Modifying
    @Query("UPDATE PostComment c SET c.deletedAt = :deletedAt WHERE c.post.postId = :postId")
    void softDeleteCommentsByPostId(@Param("postId") Long postId, @Param("deletedAt") java.time.LocalDateTime deletedAt);
}