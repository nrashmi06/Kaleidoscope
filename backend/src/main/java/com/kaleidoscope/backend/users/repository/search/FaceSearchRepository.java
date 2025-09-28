package com.kaleidoscope.backend.users.repository.search;

import com.kaleidoscope.backend.users.document.FaceSearchDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaceSearchRepository extends ElasticsearchRepository<FaceSearchDocument, String> {
    
    // Find faces by detection status
    List<FaceSearchDocument> findByDetectionStatus(String status);
    
    // Find faces by identified user
    List<FaceSearchDocument> findByIdentifiedUserUserId(Long userId);
    
    // Find faces by suggested user
    List<FaceSearchDocument> findBySuggestedUserUserId(Long userId);
    
    // Find faces by confidence threshold
    List<FaceSearchDocument> findByConfidenceScoreGreaterThan(Double minConfidence);
    
    // Find faces in a specific media
    List<FaceSearchDocument> findByMediaId(Long mediaId);
    
    // Find faces in posts by specific uploader
    List<FaceSearchDocument> findByPostContextUploaderId(Long userId);
}
