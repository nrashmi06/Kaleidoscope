package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.PostMedia;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.shared.enums.MediaType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {
    
    List<PostMedia> findByPostOrderByPositionAsc(Post post);
    
    List<PostMedia> findByPostAndMediaType(Post post, MediaType mediaType);
    
    List<PostMedia> findByMediaType(MediaType mediaType);
    
    @Query("SELECT pm FROM PostMedia pm WHERE pm.post = :post ORDER BY pm.position ASC")
    List<PostMedia> findByPostOrderedByPosition(@Param("post") Post post);
    
    @Query("SELECT COUNT(pm) FROM PostMedia pm WHERE pm.post = :post")
    long countByPost(@Param("post") Post post);
    
    @Query("SELECT COUNT(pm) FROM PostMedia pm WHERE pm.post = :post AND pm.mediaType = :mediaType")
    long countByPostAndMediaType(@Param("post") Post post, @Param("mediaType") MediaType mediaType);
    
    void deleteByPost(Post post);
    
    boolean existsByPost(Post post);
}
