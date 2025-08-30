package com.kaleidoscope.backend.blogs.repository;

import com.kaleidoscope.backend.blogs.model.BlogTag;
import com.kaleidoscope.backend.blogs.model.Blog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface BlogTagRepository extends JpaRepository<BlogTag, Long> {
    Optional<BlogTag> findByTaggingBlogAndTaggedBlog(Blog taggingBlog, Blog taggedBlog);
    List<BlogTag> findByTaggingBlog(Blog taggingBlog);
    List<BlogTag> findByTaggedBlog(Blog taggedBlog);
}
