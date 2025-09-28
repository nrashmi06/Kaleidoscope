package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.MediaAiInsights;
import com.kaleidoscope.backend.posts.enums.MediaAiStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaAiInsightsRepository extends JpaRepository<MediaAiInsights, Long> {
    
    List<MediaAiInsights> findByPost_PostId(Long postId);

    List<MediaAiInsights> findByStatus(MediaAiStatus status);
    
    Optional<MediaAiInsights> findByMediaId(Long mediaId);
    
    @Query("SELECT m FROM MediaAiInsights m WHERE m.status = :status AND m.isSafe = true")
    List<MediaAiInsights> findSafeMediaByStatus(@Param("status") MediaAiStatus status);
}
