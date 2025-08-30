package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.model.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    @Query("SELECT r.reactionType, COUNT(r) FROM Reaction r WHERE r.contentId = :contentId AND r.contentType = :contentType GROUP BY r.reactionType")
    List<Object[]> countReactionsByContentGroupedByType(@Param("contentId") Long contentId, @Param("contentType") ContentType contentType);

    @Modifying
    @Query("UPDATE Reaction r SET r.deletedAt = :deletedAt WHERE r.contentId = :contentId AND r.contentType = :contentType")
    void softDeleteReactionsByContent(@Param("contentId") Long contentId, @Param("contentType") ContentType contentType, @Param("deletedAt") LocalDateTime deletedAt);

    @Query("SELECT r FROM Reaction r WHERE r.contentId = :contentId AND r.contentType = :contentType AND r.user.userId = :userId")
    Optional<Reaction> findByContentAndUser(@Param("contentId") Long contentId, @Param("contentType") ContentType contentType, @Param("userId") Long userId);

    @Query(value = "SELECT * FROM reactions r WHERE r.content_id = :contentId AND r.content_type = :contentType AND r.user_id = :userId ORDER BY r.reaction_id DESC LIMIT 1", nativeQuery = true)
    Optional<Reaction> findAnyByContentAndUserIncludeDeleted(@Param("contentId") Long contentId, @Param("contentType") String contentType, @Param("userId") Long userId);
}