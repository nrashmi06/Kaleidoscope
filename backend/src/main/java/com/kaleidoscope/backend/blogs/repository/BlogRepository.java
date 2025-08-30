package com.kaleidoscope.backend.blogs.repository;

import com.kaleidoscope.backend.blogs.model.Blog;
import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {

    List<Blog> findByUser_UserId(Long userId);

    List<Blog> findByLocation_LocationId(Long locationId);
    List<Blog> findByBlogStatus(BlogStatus blogStatus);
    List<Blog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<Blog> findByDeletedAtIsNotNull();
}