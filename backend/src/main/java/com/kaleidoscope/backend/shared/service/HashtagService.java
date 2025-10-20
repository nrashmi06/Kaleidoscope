package com.kaleidoscope.backend.shared.service;

import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.shared.model.Hashtag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

public interface HashtagService {
    
    /**
     * Parse hashtags from text content (e.g., "#java #spring")
     * @param content The text content containing hashtags
     * @return Set of hashtag names without the # symbol
     */
    Set<String> parseHashtags(String content);
    
    /**
     * Find existing hashtags or create new ones
     * @param hashtagNames Set of hashtag names
     * @return List of Hashtag entities
     */
    List<Hashtag> findOrCreateHashtags(Set<String> hashtagNames);
    
    /**
     * Associate hashtags with a post
     * @param post The post to associate hashtags with
     * @param hashtags List of hashtag entities
     */
    void associateHashtagsWithPost(Post post, List<Hashtag> hashtags);
    
    /**
     * Disassociate hashtags from a post (when post is deleted)
     * @param post The post to disassociate hashtags from
     */
    void disassociateHashtagsFromPost(Post post);
    
    /**
     * Trigger asynchronous update of hashtag usage counts
     * @param hashtagNames Set of hashtag names
     * @param increment true to increment, false to decrement
     */
    void triggerHashtagUsageUpdate(Set<String> hashtagNames, boolean increment);
    
    /**
     * Get trending hashtags ordered by usage count
     * @param pageable Pagination parameters
     * @return Page of trending hashtags
     */
    Page<Hashtag> getTrendingHashtags(Pageable pageable);

    /**
     * Get hashtag suggestions based on prefix
     * @param prefix The prefix to search for
     * @param pageable Pagination parameters
     * @return Page of suggested hashtags
     */
    Page<Hashtag> suggestHashtags(String prefix, Pageable pageable);

    /**
     * Delete a hashtag by ID (admin only)
     * @param hashtagId The ID of the hashtag to delete
     */
    void deleteHashtagById(Long hashtagId);
}
