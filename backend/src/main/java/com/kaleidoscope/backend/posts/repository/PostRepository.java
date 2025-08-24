package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.shared.model.Category;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    // Basic queries
    List<Post> findByUserOrderByCreatedAtDesc(User user);
    
    List<Post> findByStatusOrderByCreatedAtDesc(PostStatus status);
    
    List<Post> findByVisibilityOrderByCreatedAtDesc(PostVisibility visibility);
    
    List<Post> findByUserAndStatusOrderByCreatedAtDesc(User user, PostStatus status);
    
    List<Post> findByUserAndVisibilityOrderByCreatedAtDesc(User user, PostVisibility visibility);
    
    // Location-based queries
    List<Post> findByLocationOrderByCreatedAtDesc(Location location);
    
    List<Post> findByLocationAndVisibilityOrderByCreatedAtDesc(Location location, PostVisibility visibility);
    
    // Scheduled posts
    List<Post> findByScheduledAtBeforeAndStatus(LocalDateTime dateTime, PostStatus status);
    
    List<Post> findByUserAndScheduledAtIsNotNullOrderByScheduledAtAsc(User user);
    
    // Public posts for feed
    @Query("SELECT p FROM Post p WHERE p.visibility = 'PUBLIC' AND p.status = 'PUBLISHED' ORDER BY p.createdAt DESC")
    Page<Post> findPublicPublishedPosts(Pageable pageable);
    
    @Query("SELECT p FROM Post p WHERE p.user = :user AND p.visibility IN ('PUBLIC', 'FOLLOWERS') AND p.status = 'PUBLISHED' ORDER BY p.createdAt DESC")
    Page<Post> findUserVisiblePosts(@Param("user") User user, Pageable pageable);
    
    // Search queries
    @Query("SELECT p FROM Post p WHERE (p.title LIKE %:keyword% OR p.body LIKE %:keyword% OR p.summary LIKE %:keyword%) AND p.visibility = 'PUBLIC' AND p.status = 'PUBLISHED' ORDER BY p.createdAt DESC")
    Page<Post> searchPublicPosts(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT p FROM Post p WHERE p.user = :user AND (p.title LIKE %:keyword% OR p.body LIKE %:keyword% OR p.summary LIKE %:keyword%) ORDER BY p.createdAt DESC")
    Page<Post> searchUserPosts(@Param("user") User user, @Param("keyword") String keyword, Pageable pageable);
    
    // Category-based queries
    @Query("SELECT p FROM Post p JOIN p.categories pc WHERE pc.category = :category AND p.visibility = 'PUBLIC' AND p.status = 'PUBLISHED' ORDER BY p.createdAt DESC")
    Page<Post> findPostsByCategory(@Param("category") Category category, Pageable pageable);
    
    @Query("SELECT p FROM Post p JOIN p.categories pc WHERE pc.category IN :categories AND p.visibility = 'PUBLIC' AND p.status = 'PUBLISHED' ORDER BY p.createdAt DESC")
    Page<Post> findPostsByCategories(@Param("categories") List<Category> categories, Pageable pageable);
    
    // Statistics and counts
    @Query("SELECT COUNT(p) FROM Post p WHERE p.user = :user")
    long countByUser(@Param("user") User user);
    
    @Query("SELECT COUNT(p) FROM Post p WHERE p.user = :user AND p.status = :status")
    long countByUserAndStatus(@Param("user") User user, @Param("status") PostStatus status);
    
    @Query("SELECT COUNT(p) FROM Post p WHERE p.visibility = 'PUBLIC' AND p.status = 'PUBLISHED'")
    long countPublicPublishedPosts();
    
    // Feed queries for following users
    @Query("SELECT p FROM Post p WHERE p.user IN :users AND p.visibility IN ('PUBLIC', 'FOLLOWERS') AND p.status = 'PUBLISHED' ORDER BY p.createdAt DESC")
    Page<Post> findPostsByUsers(@Param("users") List<User> users, Pageable pageable);
    
    // Recent activity
    @Query("SELECT p FROM Post p WHERE p.createdAt >= :since AND p.visibility = 'PUBLIC' AND p.status = 'PUBLISHED' ORDER BY p.createdAt DESC")
    List<Post> findRecentPublicPosts(@Param("since") LocalDateTime since);
    
    // Soft delete queries (these work with the @Where annotation)
    @Query("SELECT p FROM Post p WHERE p.user = :user AND p.deletedAt IS NULL ORDER BY p.createdAt DESC")
    List<Post> findActivePostsByUser(@Param("user") User user);
    
    // Popular posts (assuming engagement metrics)
    @Query("SELECT p FROM Post p LEFT JOIN p.comments c LEFT JOIN Like l ON l.post = p WHERE p.visibility = 'PUBLIC' AND p.status = 'PUBLISHED' GROUP BY p ORDER BY (COUNT(c) + COUNT(l)) DESC")
    Page<Post> findPopularPosts(Pageable pageable);
    
    // Draft management
    @Query("SELECT p FROM Post p WHERE p.user = :user AND p.status = 'DRAFT' ORDER BY p.updatedAt DESC")
    List<Post> findDraftsByUser(@Param("user") User user);
    
    // Existence checks
    boolean existsByUserAndTitle(User user, String title);
    
    boolean existsByPostIdAndUser(Long postId, User user);
}
