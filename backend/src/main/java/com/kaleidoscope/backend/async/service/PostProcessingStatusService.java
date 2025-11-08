package com.kaleidoscope.backend.async.service;

import com.kaleidoscope.backend.posts.enums.MediaAiStatus;
import com.kaleidoscope.backend.posts.repository.MediaAiInsightsRepository;
import com.kaleidoscope.backend.posts.repository.PostMediaRepository;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service to check if all media for a given post have completed AI processing.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PostProcessingStatusService {

    private final PostMediaRepository postMediaRepository;
    private final MediaAiInsightsRepository mediaAiInsightsRepository;
    private final PostRepository postRepository; // Need this to get a reference for the countByPost query

    /**
     * Checks if all media items for a given post have been processed by the AI.
     *
     * @param postId The ID of the post to check.
     * @return true if all media are processed, false otherwise.
     */
    @Transactional(readOnly = true)
    public boolean allMediaProcessedForPost(Long postId) {
        log.debug("Checking processing status for postId: {}", postId);
        try {
            // This query is efficient and doesn't load the full post or media objects
            long totalMedia = postMediaRepository.countByPost(postRepository.getReferenceById(postId));
            
            if (totalMedia == 0) {
                log.warn("No media found for postId: {}, cannot check status.", postId);
                return false; 
            }

            // This new query efficiently counts completed items
            long processedMedia = mediaAiInsightsRepository.countByPost_PostIdAndStatus(
                postId, MediaAiStatus.COMPLETED);

            log.debug("PostID: {} has {} total media and {} processed media.", postId, totalMedia, processedMedia);
            return totalMedia == processedMedia;
            
        } catch (Exception e) {
            log.error("Error checking processing status for postId: {}: {}", postId, e.getMessage(), e);
            return false;
        }
    }
}

