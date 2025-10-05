package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.users.model.UserFaceEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFaceEmbeddingRepository extends JpaRepository<UserFaceEmbedding, Long> {
    
    Optional<UserFaceEmbedding> findByUser_UserId(Long userId);

    List<UserFaceEmbedding> findByIsActiveTrue();
    
    @Query("SELECT u FROM UserFaceEmbedding u WHERE u.user.userId = :userId AND u.isActive = true")
    Optional<UserFaceEmbedding> findActiveByUserId(@Param("userId") Long userId);
}
