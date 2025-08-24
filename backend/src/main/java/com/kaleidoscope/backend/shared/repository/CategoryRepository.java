package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);
    Page<Category> findByParentIsNull(Pageable pageable);
    Page<Category> findByParent(Category parent, Pageable pageable);
}
