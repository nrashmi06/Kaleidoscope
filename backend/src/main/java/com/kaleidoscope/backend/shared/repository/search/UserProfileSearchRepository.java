package com.kaleidoscope.backend.shared.repository.search;

import com.kaleidoscope.backend.shared.document.UserProfileDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileSearchRepository extends ElasticsearchRepository<UserProfileDocument, String> {
    
    // Find user profile by user ID
    Optional<UserProfileDocument> findByUserId(Long userId);
    
    // Search by username
    List<UserProfileDocument> findByUsernameContaining(String username);
    
    // Search by designation
    List<UserProfileDocument> findByDesignationContaining(String designation);
    
    // Find users by interests
    List<UserProfileDocument> findByInterestsContaining(String interest);
    
    // Find influential users by follower count
    List<UserProfileDocument> findByFollowerCountGreaterThanOrderByFollowerCountDesc(Integer minFollowers);
    
    // Find most followed users
    List<UserProfileDocument> findAllByOrderByFollowerCountDesc();
}
