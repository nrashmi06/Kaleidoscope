package com.kaleidoscope.backend.users.repository.search;

import com.kaleidoscope.backend.users.document.UserFaceEmbeddingDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFaceEmbeddingSearchRepository extends ElasticsearchRepository<UserFaceEmbeddingDocument, String> {
    
    // Find active face embeddings
    List<UserFaceEmbeddingDocument> findByIsActiveTrue();
    
    // Find by user ID
    Optional<UserFaceEmbeddingDocument> findByUserId(Long userId);
    
    // Find active embedding for specific user
    Optional<UserFaceEmbeddingDocument> findByUserIdAndIsActiveTrue(Long userId);
    
    // Search by username context
    List<UserFaceEmbeddingDocument> findByUserContext_UsernameContaining(String username);
}
