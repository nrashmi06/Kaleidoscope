package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {
    @Modifying
    @Transactional
    @Query("DELETE FROM Post p WHERE p.postId = :postId")
    void hardDeleteById(Long postId);

    @Query("SELECT p.viewCount FROM Post p WHERE p.postId = :postId")
    Long findViewCountByPostId(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + :increment WHERE p.postId = :postId")
    int incrementViewCount(@Param("postId") Long postId, @Param("increment") long increment);

    @Query("SELECT DISTINCT p FROM Post p " +
           "LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH p.media " +
           "LEFT JOIN FETCH p.categories pc " +
           "LEFT JOIN FETCH pc.category " +
           "LEFT JOIN FETCH p.location")
    Page<Post> findAllWithRelations(Pageable pageable);

    // Step 1: page by IDs only to keep pagination in SQL (no collection fetch joins here)
    @Query("SELECT p.postId FROM Post p WHERE p.postId > :lastSeenId ORDER BY p.postId ASC")
    List<Long> findNextBatchIds(@Param("lastSeenId") Long lastSeenId, Pageable pageable);

    // Step 2: hydrate full graph for selected IDs in one query
    @Query("SELECT DISTINCT p FROM Post p " +
           "LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH p.media " +
           "LEFT JOIN FETCH p.categories pc " +
           "LEFT JOIN FETCH pc.category " +
           "LEFT JOIN FETCH p.location " +
           "WHERE p.postId IN :postIds " +
           "ORDER BY p.postId ASC")
    List<Post> findByPostIdInWithRelations(@Param("postIds") List<Long> postIds);
}
