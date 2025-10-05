package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long>, JpaSpecificationExecutor<Comment> {

    /**
     * Soft-deletes all comments associated with a specific piece of content
     * by setting their deleted_at timestamp.
     *
     * @param contentId The ID of the content (Post, Blog, etc.).
     * @param contentType The type of the content.
     * @param deletedAt The timestamp to set for deletion.
     */
    @Modifying
    @Query("UPDATE Comment c SET c.deletedAt = :deletedAt WHERE c.contentId = :contentId AND c.contentType = :contentType")
    void softDeleteCommentsByContent(
            @Param("contentId") Long contentId,
            @Param("contentType") ContentType contentType,
            @Param("deletedAt") LocalDateTime deletedAt
    );

    /**
     * Counts the number of comments for a specific piece of content.
     *
     * @param contentId The ID of the content (Post, Blog, etc.).
     * @param contentType The type of the content.
     * @return The count of comments for the specified content.
     */
    long countByContentIdAndContentType(Long contentId, ContentType contentType);
}