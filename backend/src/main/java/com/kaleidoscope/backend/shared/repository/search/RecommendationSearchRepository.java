package com.kaleidoscope.backend.shared.repository.search;

import com.kaleidoscope.backend.shared.document.RecommendationDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecommendationSearchRepository extends ElasticsearchRepository<RecommendationDocument, String> {
    
    // Find recommendation by media ID
    Optional<RecommendationDocument> findByMediaId(Long mediaId);
    
    // Note: Vector similarity searches for recommendations would typically be handled
    // by custom native queries or specialized vector search operations
}
