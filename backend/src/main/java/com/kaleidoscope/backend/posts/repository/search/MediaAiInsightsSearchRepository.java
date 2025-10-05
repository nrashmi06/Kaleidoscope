package com.kaleidoscope.backend.posts.repository.search;

import com.kaleidoscope.backend.posts.document.MediaAiInsightsDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaAiInsightsSearchRepository extends ElasticsearchRepository<MediaAiInsightsDocument, String> {
    
    // Search by AI status
    List<MediaAiInsightsDocument> findByStatus(String status);
    
    // Find safe content only
    List<MediaAiInsightsDocument> findByIsSafeTrue();
    
    // Search by AI-generated tags
    List<MediaAiInsightsDocument> findByTagsContaining(String tag);
    
    // Search by AI-detected scenes
    List<MediaAiInsightsDocument> findByScenesContaining(String scene);
    
    // Search by caption content
    List<MediaAiInsightsDocument> findByCaptionContaining(String caption);
    
    // Find by post ID for post-specific AI insights
    List<MediaAiInsightsDocument> findByPostId(Long postId);
}
