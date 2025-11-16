package com.kaleidoscope.backend.blogs.service;

import com.kaleidoscope.backend.blogs.document.BlogDocument;
import com.kaleidoscope.backend.blogs.repository.BlogRepository;
import com.kaleidoscope.backend.blogs.repository.search.BlogSearchRepository;
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
public class BlogViewService {

    private final StringRedisTemplate redisTemplate;
    private final BlogRepository blogRepository;
    private final BlogSearchRepository blogSearchRepository; // ES repository added

    // Redis key patterns
    private static final String VIEW_COUNT_KEY = "blog:views:%d"; // blog:views:123
    private static final String USER_VIEW_KEY = "user:blog:view:%d:%d"; // user:blog:view:userId:blogId
    private static final String PENDING_VIEWS_SET = "pending:blog:views";
    private static final String VIEW_BATCH_LOCK = "blog:view:batch:lock";
    
    /**
     * Increment view count asynchronously with Redis optimization
     * Prevents duplicate views from same user within 24 hours
     */
    @Async("viewCountExecutor")
    public void incrementViewAsync(Long blogId, Long userId) {
        try {
            String userViewKey = String.format(USER_VIEW_KEY, userId, blogId);
            
            // Check if user already viewed this blog recently (24 hours)
            if (Boolean.TRUE.equals(redisTemplate.hasKey(userViewKey))) {
                log.debug("User {} already viewed blog {} recently, skipping", userId, blogId);
                return;
            }
            
            // Mark user as having viewed this blog (expires in 24 hours)
            redisTemplate.opsForValue().set(userViewKey, "1", 24, TimeUnit.HOURS);
            
            // Increment view count in Redis
            String viewCountKey = String.format(VIEW_COUNT_KEY, blogId);
            redisTemplate.opsForValue().increment(viewCountKey);
            
            // Add to pending views set for batch processing
            redisTemplate.opsForSet().add(PENDING_VIEWS_SET, blogId.toString());
            
            log.debug("View incremented for blog {} by user {}", blogId, userId);
            
        } catch (Exception e) {
            log.error("Failed to increment view for blog {} by user {}", blogId, userId, e);
        }
    }
    
    /**
     * Get current view count (combines DB + Redis pending views)
     */
    public long getViewCount(Long blogId) {
        try {
            String viewCountKey = String.format(VIEW_COUNT_KEY, blogId);
            String redisCount = redisTemplate.opsForValue().get(viewCountKey);
            long redisViews = redisCount != null ? Long.parseLong(redisCount) : 0;
            
            // Get DB view count
            Long dbViews = blogRepository.findViewCountByBlogId(blogId);
            long dbViewCount = dbViews != null ? dbViews : 0;
            
            return dbViewCount + redisViews;
            
        } catch (Exception e) {
            log.error("Failed to get view count for blog {}", blogId, e);
            // Fallback to database only
            Long dbViews = blogRepository.findViewCountByBlogId(blogId);
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
            
            Set<String> blogIds = redisTemplate.opsForSet().members(PENDING_VIEWS_SET);
            if (blogIds == null || blogIds.isEmpty()) {
                log.debug("No pending views to sync");
                return;
            }
            
            int syncedCount = 0;
            for (String blogIdStr : blogIds) {
                try {
                    Long blogId = Long.parseLong(blogIdStr);
                    String viewCountKey = String.format(VIEW_COUNT_KEY, blogId);

                    String redisCountStr = redisTemplate.opsForValue().get(viewCountKey);
                    if (redisCountStr != null) {
                        long redisCount = Long.parseLong(redisCountStr);

                        // Update database with Redis view count
                        int updatedRows = blogRepository.incrementViewCount(blogId, redisCount);

                        if (updatedRows > 0) {
                            // --- Elasticsearch viewCount sync ---
                            try {
                                Long currentDbViewCount = blogRepository.findViewCountByBlogId(blogId);
                                long totalViewCount = currentDbViewCount != null ? currentDbViewCount : redisCount;
                                blogSearchRepository.findById(blogIdStr).ifPresentOrElse(
                                        document -> {
                                            BlogDocument updatedDocument = document.toBuilder()
                                                    .viewCount(totalViewCount)
                                                    .build();
                                            blogSearchRepository.save(updatedDocument);
                                            log.debug("Updated Elasticsearch viewCount for blog {} to {}", blogIdStr, totalViewCount);
                                        },
                                        () -> log.warn("BlogDocument not found in Elasticsearch for blogId: {}", blogIdStr)
                                );
                            } catch (Exception esException) {
                                log.error("Failed to sync viewCount to Elasticsearch for blog {}: {}", blogIdStr, esException.getMessage(), esException);
                            }

                            // Clear Redis count and remove from pending set
                            redisTemplate.delete(viewCountKey);
                            redisTemplate.opsForSet().remove(PENDING_VIEWS_SET, blogIdStr);

                            syncedCount++;
                            log.debug("Synced {} views for blog {}", redisCount, blogId);
                        }
                    }

                } catch (Exception e) {
                    log.error("Failed to sync views for blog {}", blogIdStr, e);
                }
            }
            
            log.info("Completed batch sync: {} blogs synced", syncedCount);
            
        } catch (Exception e) {
            log.error("Failed to sync views to database", e);
        } finally {
            // Release lock
            redisTemplate.delete(VIEW_BATCH_LOCK);
        }
    }
}
