package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.Comment;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    List<Comment> findByPostAndParentCommentIsNullOrderByCreatedAtDesc(Post post);
    
    List<Comment> findByParentCommentOrderByCreatedAtAsc(Comment parentComment);
    
    List<Comment> findByUserOrderByCreatedAtDesc(User user);
    
    List<Comment> findByPostOrderByCreatedAtDesc(Post post);
    
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.post = :post AND c.status = 'ACTIVE'")
    long countActiveByPost(@Param("post") Post post);
    
    @Query("SELECT c FROM Comment c WHERE c.post = :post AND c.parentComment IS NULL AND c.status = 'ACTIVE' ORDER BY c.createdAt DESC")
    List<Comment> findActiveTopLevelCommentsByPost(@Param("post") Post post);
    
    @Query("SELECT c FROM Comment c WHERE c.parentComment = :parent AND c.status = 'ACTIVE' ORDER BY c.createdAt ASC")
    List<Comment> findActiveRepliesByParent(@Param("parent") Comment parent);
    
    void deleteByPost(Post post);
}
