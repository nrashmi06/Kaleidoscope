package com.kaleidoscope.backend.posts.repository.search;

import com.kaleidoscope.backend.posts.document.MediaSearchDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaSearchRepository extends ElasticsearchRepository<MediaSearchDocument, String> {
    
    // Search by AI tags
    List<MediaSearchDocument> findByAiTagsContaining(String tag);
    
    // Search by scenes
    List<MediaSearchDocument> findByScenesContaining(String scene);
    
    // Search by AI caption
    List<MediaSearchDocument> findByAiCaptionContaining(String caption);
    
    // Find safe media only
    List<MediaSearchDocument> findByIsSafeTrueAndAiStatus(String status);
    
    // Search by face count
    List<MediaSearchDocument> findByDetectedFaceCountBetween(Integer min, Integer max);
}
