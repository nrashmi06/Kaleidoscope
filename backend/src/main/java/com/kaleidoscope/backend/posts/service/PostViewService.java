package com.kaleidoscope.backend.posts.service;

import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.repository.search.PostSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostViewService {

    private final StringRedisTemplate redisTemplate;
    private final PostRepository postRepository;
    private final PostSearchRepository postSearchRepository;

    // Redis key patterns
    private static final String VIEW_COUNT_KEY = "post:views:%d"; // post:views:123
    private static final String USER_VIEW_KEY = "user:view:%d:%d"; // user:view:userId:postId
    private static final String PENDING_VIEWS_SET = "pending:views";
    private static final String VIEW_BATCH_LOCK = "view:batch:lock";
    
    /**
     * Increment view count asynchronously with Redis optimization
     * Prevents duplicate views from same user within 24 hours
     */
    @Async("viewCountExecutor")
    public void incrementViewAsync(Long postId, Long userId) {
        try {
            String userViewKey = String.format(USER_VIEW_KEY, userId, postId);
            
            // Check if user already viewed this post recently (24 hours)
            if (Boolean.TRUE.equals(redisTemplate.hasKey(userViewKey))) {
                log.debug("User {} already viewed post {} recently, skipping", userId, postId);
                return;
            }
            
            // Mark user as having viewed this post (expires in 24 hours)
            redisTemplate.opsForValue().set(userViewKey, "1", 24, TimeUnit.HOURS);
            
            // Increment view count in Redis
            String viewCountKey = String.format(VIEW_COUNT_KEY, postId);
            redisTemplate.opsForValue().increment(viewCountKey);
            
            // Add to pending views set for batch processing
            redisTemplate.opsForSet().add(PENDING_VIEWS_SET, postId.toString());
            
            log.debug("View incremented for post {} by user {}", postId, userId);
            
        } catch (Exception e) {
            log.error("Failed to increment view for post {} by user {}", postId, userId, e);
        }
    }
    
    /**
     * Get current view count (combines DB + Redis pending views)
     */
    public long getViewCount(Long postId) {
        try {
            String viewCountKey = String.format(VIEW_COUNT_KEY, postId);
            String redisCount = redisTemplate.opsForValue().get(viewCountKey);
            long redisViews = redisCount != null ? Long.parseLong(redisCount) : 0;
            
            // Get DB view count
            Long dbViews = postRepository.findViewCountByPostId(postId);
            long dbViewCount = dbViews != null ? dbViews : 0;
            
            return dbViewCount + redisViews;
            
        } catch (Exception e) {
            log.error("Failed to get view count for post {}", postId, e);
            // Fallback to database only
            Long dbViews = postRepository.findViewCountByPostId(postId);
            return dbViews != null ? dbViews : 0;
        }
    }
    
    /**
     * Batch sync Redis views to database every 5 minutes
     * Uses distributed locking for multi-instance safety
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void syncViewsToDatabase() {
        try {
            // Acquire distributed lock to prevent multiple instances from syncing
            Boolean lockAcquired = redisTemplate.opsForValue()
                .setIfAbsent(VIEW_BATCH_LOCK, "locked", 10, TimeUnit.MINUTES);
                
            if (!Boolean.TRUE.equals(lockAcquired)) {
                log.debug("Another instance is already syncing views, skipping");
                return;
            }
            
            log.info("Starting batch sync of views to database");
            
            Set<String> postIds = redisTemplate.opsForSet().members(PENDING_VIEWS_SET);
            if (postIds == null || postIds.isEmpty()) {
                log.debug("No pending views to sync");
                return;
            }
            
            int syncedCount = 0;
            for (String postIdStr : postIds) {
                try {
                    Long postId = Long.parseLong(postIdStr);
                    String viewCountKey = String.format(VIEW_COUNT_KEY, postId);
                    
                    String redisCountStr = redisTemplate.opsForValue().get(viewCountKey);
                    if (redisCountStr != null) {
                        long redisCount = Long.parseLong(redisCountStr);
                        
                        // Update database with Redis view count
                        int updatedRows = postRepository.incrementViewCount(postId, redisCount);
                        
                        if (updatedRows > 0) {
                            // CRUCIAL: Synchronously update Elasticsearch with the new view count
                            try {
                                // Get current DB view count after increment
                                Long currentDbViewCount = postRepository.findViewCountByPostId(postId);
                                long totalViewCount = currentDbViewCount != null ? currentDbViewCount : redisCount;

                                // Find and update the PostDocument in Elasticsearch
                                postSearchRepository.findById(postId.toString()).ifPresentOrElse(
                                    document -> {
                                        // Update the viewCount field
                                        PostDocument updatedDocument = document.toBuilder()
                                                .viewCount(totalViewCount)
                                                .build();
                                        postSearchRepository.save(updatedDocument);
                                        log.debug("Updated Elasticsearch viewCount for post {} to {}", postId, totalViewCount);
                                    },
                                    () -> log.warn("PostDocument not found in Elasticsearch for postId: {}", postId)
                                );

                            } catch (Exception esException) {
                                log.error("Failed to sync viewCount to Elasticsearch for post {}: {}",
                                         postId, esException.getMessage(), esException);
                                // Continue processing other posts even if ES sync fails
                            }

                            // Clear Redis count and remove from pending set
                            redisTemplate.delete(viewCountKey);
                            redisTemplate.opsForSet().remove(PENDING_VIEWS_SET, postIdStr);
                            
                            syncedCount++;
                            log.debug("Synced {} views for post {}", redisCount, postId);
                        }
                    }
                    
                } catch (Exception e) {
                    log.error("Failed to sync views for post {}", postIdStr, e);
                }
            }
            
            log.info("Completed batch sync: {} posts synced", syncedCount);
            
        } catch (Exception e) {
            log.error("Failed to sync views to database", e);
        } finally {
            // Release lock
            redisTemplate.delete(VIEW_BATCH_LOCK);
        }
    }
}
