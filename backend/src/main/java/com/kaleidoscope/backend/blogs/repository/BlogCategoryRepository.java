package com.kaleidoscope.backend.blogs.repository;

import com.kaleidoscope.backend.blogs.model.BlogCategory;
import com.kaleidoscope.backend.blogs.model.BlogCategoryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlogCategoryRepository extends JpaRepository<BlogCategory, BlogCategoryId> {

}