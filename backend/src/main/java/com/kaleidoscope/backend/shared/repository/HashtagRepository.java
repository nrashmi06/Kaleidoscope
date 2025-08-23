package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.model.Hashtag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HashtagRepository extends JpaRepository<Hashtag, Long> {
    
    Optional<Hashtag> findByName(String name);
    
    List<Hashtag> findByNameIn(List<String> names);
    
    @Query("SELECT h FROM Hashtag h WHERE h.name LIKE %:keyword%")
    List<Hashtag> searchByKeyword(@Param("keyword") String keyword);
    
    @Query("SELECT h FROM Hashtag h ORDER BY h.usageCount DESC")
    List<Hashtag> findAllOrderByUsageCountDesc();
    
    @Query("SELECT h FROM Hashtag h WHERE h.usageCount > :minCount ORDER BY h.usageCount DESC")
    List<Hashtag> findPopularHashtags(@Param("minCount") Integer minCount);
    
    @Query("SELECT h FROM Hashtag h ORDER BY h.createdAt DESC LIMIT :limit")
    List<Hashtag> findRecentHashtags(@Param("limit") int limit);
    
    @Modifying
    @Query("UPDATE Hashtag h SET h.usageCount = h.usageCount + 1 WHERE h.hashtagId = :hashtagId")
    void incrementUsageCount(@Param("hashtagId") Long hashtagId);
    
    @Modifying
    @Query("UPDATE Hashtag h SET h.usageCount = h.usageCount - 1 WHERE h.hashtagId = :hashtagId AND h.usageCount > 0")
    void decrementUsageCount(@Param("hashtagId") Long hashtagId);
    
    boolean existsByName(String name);
}
