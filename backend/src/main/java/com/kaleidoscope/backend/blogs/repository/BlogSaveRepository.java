package com.kaleidoscope.backend.blogs.repository;

import com.kaleidoscope.backend.blogs.model.BlogSave;
import com.kaleidoscope.backend.blogs.model.Blog;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogSaveRepository extends JpaRepository<BlogSave, Long> {
    
    Optional<BlogSave> findByBlogAndUser(Blog blog, User user);
    
    List<BlogSave> findByUserOrderByCreatedAtDesc(User user);
    
    Page<BlogSave> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<BlogSave> findByBlogOrderByCreatedAtDesc(Blog blog);
    
    boolean existsByBlogAndUser(Blog blog, User user);
    
    @Modifying
    void deleteByBlogAndUser(Blog blog, User user);
    
    @Query("SELECT COUNT(bs) FROM BlogSave bs WHERE bs.blog = :blog")
    long countByBlog(@Param("blog") Blog blog);
    
    @Query("SELECT bs.blog FROM BlogSave bs WHERE bs.user = :user ORDER BY bs.createdAt DESC")
    List<Blog> findSavedBlogsByUser(@Param("user") User user);
}

