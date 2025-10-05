package com.kaleidoscope.backend.posts.repository.search;

import com.kaleidoscope.backend.posts.document.MediaDetectedFaceDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaDetectedFaceSearchRepository extends ElasticsearchRepository<MediaDetectedFaceDocument, String> {
    
    // Find faces by detection status
    List<MediaDetectedFaceDocument> findByStatus(String status);
    
    // Find faces by identified user
    List<MediaDetectedFaceDocument> findByIdentifiedUserId(Long userId);
    
    // Find faces by suggested user
    List<MediaDetectedFaceDocument> findBySuggestedUserId(Long userId);
    
    // Find faces by confidence threshold
    List<MediaDetectedFaceDocument> findByConfidenceScoreGreaterThan(Float minConfidence);
    
    // Find faces in specific media
    List<MediaDetectedFaceDocument> findByMediaId(Long mediaId);
    
    // Find confirmed face identifications
    List<MediaDetectedFaceDocument> findByStatusAndIdentifiedUserId(String status, Long userId);
}
