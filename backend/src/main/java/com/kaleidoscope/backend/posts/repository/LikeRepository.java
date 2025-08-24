package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.Like;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    
    Optional<Like> findByPostAndUser(Post post, User user);
    
    List<Like> findByUserOrderByCreatedAtDesc(User user);
    
    List<Like> findByPostOrderByCreatedAtDesc(Post post);
    
    boolean existsByPostAndUser(Post post, User user);
    
    void deleteByPostAndUser(Post post, User user);
    
    @Query("SELECT COUNT(l) FROM Like l WHERE l.post = :post")
    long countByPost(@Param("post") Post post);
    
    @Query("SELECT l.post FROM Like l WHERE l.user = :user ORDER BY l.createdAt DESC")
    List<Post> findLikedPostsByUser(@Param("user") User user);
    
    @Query("SELECT l.user FROM Like l WHERE l.post = :post ORDER BY l.createdAt DESC")
    List<User> findUsersByPost(@Param("post") Post post);
    
    void deleteByPost(Post post);
}
