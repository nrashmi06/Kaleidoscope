package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.users.model.UserBlock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    List<UserBlock> findByBlocker_UserId(Long blockerId);
    List<UserBlock> findByBlocked_UserId(Long blockedId);

    Optional<UserBlock> findByBlocker_UserIdAndBlocked_UserId(Long blockerId, Long blockedId);

    @Query("SELECT ub FROM UserBlock ub JOIN FETCH ub.blocked WHERE ub.blocker.userId = :blockerId")
    Page<UserBlock> findByBlocker_UserIdWithBlocked(@Param("blockerId") Long blockerId, Pageable pageable);

    @Query("SELECT ub FROM UserBlock ub JOIN FETCH ub.blocker WHERE ub.blocked.userId = :blockedId")
    Page<UserBlock> findByBlocked_UserIdWithBlocker(@Param("blockedId") Long blockedId, Pageable pageable);

    @Query("SELECT ub FROM UserBlock ub JOIN FETCH ub.blocker JOIN FETCH ub.blocked")
    Page<UserBlock> findAllWithBlockerAndBlocked(Pageable pageable);

    /**
     * Find blocks between two users in both directions (optimized single query)
     */
    @Query("SELECT ub FROM UserBlock ub JOIN FETCH ub.blocker JOIN FETCH ub.blocked " +
           "WHERE (ub.blocker.userId = :userId1 AND ub.blocked.userId = :userId2) " +
           "OR (ub.blocker.userId = :userId2 AND ub.blocked.userId = :userId1)")
    List<UserBlock> findBlocksBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * Check if there's a block relationship between two users in either direction
     */
    @Query("SELECT COUNT(ub) > 0 FROM UserBlock ub " +
           "WHERE (ub.blocker.userId = :userId1 AND ub.blocked.userId = :userId2) " +
           "OR (ub.blocker.userId = :userId2 AND ub.blocked.userId = :userId1)")
    boolean existsBlockRelationship(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
