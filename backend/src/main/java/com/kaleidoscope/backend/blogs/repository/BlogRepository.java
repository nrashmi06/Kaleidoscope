package com.kaleidoscope.backend.blogs.repository;

import com.kaleidoscope.backend.blogs.model.Blog;
import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long>, JpaSpecificationExecutor<Blog> {

    List<Blog> findByUser_UserId(Long userId);

    List<Blog> findByLocation_LocationId(Long locationId);
    List<Blog> findByBlogStatus(BlogStatus blogStatus);
    List<Blog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<Blog> findByDeletedAtIsNotNull();
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Blog b WHERE b.blogId = :blogId")
    void hardDeleteById(Long blogId);

    @Query("SELECT b.viewCount FROM Blog b WHERE b.blogId = :blogId")
    Long findViewCountByBlogId(@Param("blogId") Long blogId);

    @Modifying
    @Transactional
    @Query("UPDATE Blog b SET b.viewCount = b.viewCount + :increment WHERE b.blogId = :blogId")
    int incrementViewCount(@Param("blogId") Long blogId, @Param("increment") long increment);

    @Query("SELECT DISTINCT b FROM Blog b " +
            "LEFT JOIN FETCH b.user " +
            "LEFT JOIN FETCH b.reviewer " +
            "LEFT JOIN FETCH b.media " +
            "LEFT JOIN FETCH b.categories bc " +
            "LEFT JOIN FETCH bc.category " +
            "LEFT JOIN FETCH b.location " +
            "LEFT JOIN FETCH b.taggedBlogs bt " +
            "LEFT JOIN FETCH bt.taggedBlog")
    Page<Blog> findAllWithRelations(Pageable pageable);
}