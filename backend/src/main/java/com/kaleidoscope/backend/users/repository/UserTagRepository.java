package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.users.model.UserTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTagRepository extends JpaRepository<UserTag, Long> {
    
    Optional<UserTag> findByName(String name);
    
    List<UserTag> findByNameIn(List<String> names);
    
    List<UserTag> findByIsSystemTagTrue();
    
    List<UserTag> findByIsSystemTagFalse();
    
    @Query("SELECT ut FROM UserTag ut WHERE ut.name LIKE %:keyword%")
    List<UserTag> searchByKeyword(@Param("keyword") String keyword);
    
    @Query("SELECT ut FROM UserTag ut ORDER BY ut.usageCount DESC")
    List<UserTag> findAllOrderByUsageCountDesc();
    
    @Query("SELECT ut FROM UserTag ut WHERE ut.usageCount > :minCount ORDER BY ut.usageCount DESC")
    List<UserTag> findPopularTags(@Param("minCount") Integer minCount);
    
    @Query("SELECT ut FROM UserTag ut ORDER BY ut.createdAt DESC LIMIT :limit")
    List<UserTag> findRecentTags(@Param("limit") int limit);
    
    @Modifying
    @Query("UPDATE UserTag ut SET ut.usageCount = ut.usageCount + 1 WHERE ut.tagId = :tagId")
    void incrementUsageCount(@Param("tagId") Long tagId);
    
    @Modifying
    @Query("UPDATE UserTag ut SET ut.usageCount = ut.usageCount - 1 WHERE ut.tagId = :tagId AND ut.usageCount > 0")
    void decrementUsageCount(@Param("tagId") Long tagId);
    
    boolean existsByName(String name);
}
