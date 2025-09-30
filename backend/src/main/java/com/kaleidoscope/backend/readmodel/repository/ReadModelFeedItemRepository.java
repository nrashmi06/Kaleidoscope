package com.kaleidoscope.backend.readmodel.repository;

import com.kaleidoscope.backend.readmodel.model.ReadModelFeedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface ReadModelFeedItemRepository extends JpaRepository<ReadModelFeedItem, Long> {
    
    List<ReadModelFeedItem> findByUploader_UserId(Long uploaderId);

    List<ReadModelFeedItem> findByPost_PostId(Long postId);

    @Query("SELECT f FROM ReadModelFeedItem f WHERE f.createdAt >= :since ORDER BY f.reactionCount DESC, f.createdAt DESC")
    List<ReadModelFeedItem> findTrendingFeedItems(@Param("since") OffsetDateTime since);
    
    @Query("SELECT f FROM ReadModelFeedItem f ORDER BY f.createdAt DESC")
    List<ReadModelFeedItem> findLatestFeedItems();
}
