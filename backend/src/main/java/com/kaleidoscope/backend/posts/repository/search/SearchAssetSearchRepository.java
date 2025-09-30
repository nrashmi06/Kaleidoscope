package com.kaleidoscope.backend.posts.repository.search;

import com.kaleidoscope.backend.posts.document.SearchAssetDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchAssetSearchRepository extends ElasticsearchRepository<SearchAssetDocument, String> {
    
    // Search by caption content
    List<SearchAssetDocument> findByCaptionContaining(String caption);
    
    // Search by AI tags
    List<SearchAssetDocument> findByTagsContaining(String tag);
    
    // Search by AI scenes
    List<SearchAssetDocument> findByScenesContaining(String scene);
    
    // Find popular content by reaction count
    List<SearchAssetDocument> findByReactionCountGreaterThanOrderByReactionCountDesc(Integer minReactions);
    
    // Find by post ID
    List<SearchAssetDocument> findByPostId(Long postId);
    
    // Search across multiple fields (caption, tags, scenes)
    List<SearchAssetDocument> findByCaptionContainingOrTagsContainingOrScenesContaining(
        String caption, String tag, String scene);
}
