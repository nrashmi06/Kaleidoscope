package com.kaleidoscope.backend.posts.repository.search;

import com.kaleidoscope.backend.posts.document.FeedItemDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface FeedItemSearchRepository extends ElasticsearchRepository<FeedItemDocument, String> {
    
    // Find feed items by uploader
    List<FeedItemDocument> findByUploaderId(Long uploaderId);
    
    // Find feed items by post
    List<FeedItemDocument> findByPostId(Long postId);
    
    // Find trending feed items by reaction count
    List<FeedItemDocument> findByReactionCountGreaterThanOrderByReactionCountDesc(Integer minReactions);
    
    // Find recent feed items
    List<FeedItemDocument> findByCreatedAtAfterOrderByCreatedAtDesc(OffsetDateTime since);
    
    // Search feed captions
    List<FeedItemDocument> findByCaptionContaining(String caption);
    
    // Find feed items by uploader username
    List<FeedItemDocument> findByUploader_UsernameContaining(String username);
}
