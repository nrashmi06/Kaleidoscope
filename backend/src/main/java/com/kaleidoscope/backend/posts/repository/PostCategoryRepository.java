package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.PostCategory;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.shared.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostCategoryRepository extends JpaRepository<PostCategory, Long> {
    
    List<PostCategory> findByPost(Post post);
    
    List<PostCategory> findByCategory(Category category);
    
    Optional<PostCategory> findByPostAndCategory(Post post, Category category);
    
    Optional<PostCategory> findByPostAndIsPrimaryTrue(Post post);
    
    @Query("SELECT pc.category FROM PostCategory pc WHERE pc.post = :post")
    List<Category> findCategoriesByPost(@Param("post") Post post);
    
    @Query("SELECT pc.post FROM PostCategory pc WHERE pc.category = :category ORDER BY pc.createdAt DESC")
    List<Post> findPostsByCategory(@Param("category") Category category);
    
    @Query("SELECT pc.category FROM PostCategory pc WHERE pc.post = :post AND pc.isPrimary = true")
    Optional<Category> findPrimaryCategoryByPost(@Param("post") Post post);
    
    boolean existsByPostAndCategory(Post post, Category category);
    
    void deleteByPost(Post post);
    
    void deleteByPostAndCategory(Post post, Category category);
}
