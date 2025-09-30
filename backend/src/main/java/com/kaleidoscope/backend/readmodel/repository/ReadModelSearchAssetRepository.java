package com.kaleidoscope.backend.readmodel.repository;

import com.kaleidoscope.backend.readmodel.model.ReadModelSearchAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadModelSearchAssetRepository extends JpaRepository<ReadModelSearchAsset, Long> {
    
    List<ReadModelSearchAsset> findByPost_PostId(Long postId);

    @Query("SELECT r FROM ReadModelSearchAsset r WHERE r.reactionCount >= :minReactions ORDER BY r.reactionCount DESC")
    List<ReadModelSearchAsset> findPopularAssets(@Param("minReactions") Integer minReactions);
    
    @Query("SELECT r FROM ReadModelSearchAsset r WHERE r.caption LIKE %:keyword% OR ARRAY_TO_STRING(r.tags, ',') LIKE %:keyword%")
    List<ReadModelSearchAsset> searchByKeyword(@Param("keyword") String keyword);
}
