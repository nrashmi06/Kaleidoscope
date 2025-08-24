package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.PostSave;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostSaveRepository extends JpaRepository<PostSave, Long> {
    
    Optional<PostSave> findByPostAndUser(Post post, User user);
    
    List<PostSave> findByUserOrderByCreatedAtDesc(User user);
    
    List<PostSave> findByPostOrderByCreatedAtDesc(Post post);
    
    boolean existsByPostAndUser(Post post, User user);
    
    void deleteByPostAndUser(Post post, User user);
    
    @Query("SELECT COUNT(ps) FROM PostSave ps WHERE ps.post = :post")
    long countByPost(@Param("post") Post post);
    
    @Query("SELECT ps.post FROM PostSave ps WHERE ps.user = :user ORDER BY ps.createdAt DESC")
    List<Post> findSavedPostsByUser(@Param("user") User user);
}
