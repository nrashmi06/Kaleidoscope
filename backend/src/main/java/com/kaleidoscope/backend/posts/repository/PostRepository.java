package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {
    @Modifying
    @Transactional
    @Query("DELETE FROM Post p WHERE p.postId = :postId")
    void hardDeleteById(Long postId);
}
