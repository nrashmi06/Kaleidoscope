package com.kaleidoscope.backend.blogs.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.blogs.document.BlogDocument;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.blogs.mapper.BlogMapper;
import com.kaleidoscope.backend.blogs.repository.search.BlogSearchRepository;
import com.kaleidoscope.backend.blogs.service.BlogSuggestionService;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.repository.CommentRepository;
import com.kaleidoscope.backend.shared.repository.ReactionRepository;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.document.UserDocument;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import com.kaleidoscope.backend.users.repository.search.UserSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Implementation of BlogSuggestionService
 * Generates personalized blog suggestions using Elasticsearch function_score queries
 * Mirrors PostSuggestionServiceImpl functionality for blogs
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BlogSuggestionServiceImpl implements BlogSuggestionService {

    private final JwtUtils jwtUtils;
    private final UserSearchRepository userSearchRepository;
    private final FollowRepository followRepository;
    private final BlogSearchRepository blogSearchRepository;
    private final BlogMapper blogMapper;
    private final StringRedisTemplate stringRedisTemplate;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<BlogSummaryResponseDTO> getBlogSuggestions(Pageable pageable) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Generating blog suggestions for user: {}", currentUserId);

        UserDocument userDoc = userSearchRepository.findById(String.valueOf(currentUserId))
                .orElseThrow(() -> new RuntimeException("UserDocument not found for user: " + currentUserId));

        List<Long> interestIds = userDoc.getInterests() != null ? userDoc.getInterests() : Collections.emptyList();
        List<Long> blockedUserIds = userDoc.getBlockedUserIds() != null ? userDoc.getBlockedUserIds() : Collections.emptyList();
        List<Long> blockedByUserIds = userDoc.getBlockedByUserIds() != null ? userDoc.getBlockedByUserIds() : Collections.emptyList();
        Set<Long> followingIds = followRepository.findFollowingIdsByFollowerId(currentUserId);

        log.debug("User context - Interests: {}, Blocked users: {}, Blocked by: {}, Following: {}",
                interestIds.size(), blockedUserIds.size(), blockedByUserIds.size(), followingIds.size());

        Set<String> viewedBlogIds = getBlogViewsFromRedis(currentUserId);
        List<Long> socialContextBlogIds = getSocialContextBlogIds(currentUserId);

        Page<BlogDocument> blogDocuments = blogSearchRepository.findBlogSuggestions(
                currentUserId, followingIds, interestIds, blockedUserIds, blockedByUserIds,
                viewedBlogIds, socialContextBlogIds, pageable
        );

        log.info("Found {} blog suggestions for user {}", blogDocuments.getTotalElements(), currentUserId);

        return PaginatedResponse.fromPage(blogDocuments.map(blogMapper::toBlogSummaryDTO));
    }

    /**
     * Fetch viewed blog IDs from Redis
     * Uses key pattern: "viewed_blogs:{userId}"
     */
    private Set<String> getBlogViewsFromRedis(Long currentUserId) {
        try {
            String viewedKey = "viewed_blogs:" + currentUserId;
            Set<String> viewedBlogIds = stringRedisTemplate.opsForSet().members(viewedKey);
            log.debug("Retrieved {} viewed blog IDs from Redis for user {}", 
                     viewedBlogIds != null ? viewedBlogIds.size() : 0, currentUserId);
            return (viewedBlogIds != null) ? viewedBlogIds : Collections.emptySet();
        } catch (Exception e) {
            log.error("Failed to fetch viewed blog IDs from Redis for user {}: {}", currentUserId, e.getMessage());
            return Collections.emptySet();
        }
    }

    /**
     * Get social context blog IDs (blogs that tag blogs the user has interacted with)
     * This provides a "friends of friends" style boost for content discovery
     */
    private List<Long> getSocialContextBlogIds(Long currentUserId) {
        try {
            // Find all blogs the user has liked or commented on
            Set<Long> interactedBlogIds = Stream.concat(
                reactionRepository.findContentIdsByUserIdAndContentType(currentUserId, ContentType.BLOG).stream(),
                commentRepository.findContentIdsByUserIdAndContentType(currentUserId, ContentType.BLOG).stream()
            ).collect(Collectors.toSet());

            if (interactedBlogIds.isEmpty()) {
                log.debug("User {} has not interacted with any blogs yet", currentUserId);
                return Collections.emptyList();
            }

            log.info("Found {} blogs user {} has interacted with. Checking for tags.", 
                    interactedBlogIds.size(), currentUserId);
            
            // Find blogs that tag any of the blogs the user has interacted with
            List<Long> taggingBlogIds = blogSearchRepository.findBlogsThatTagAny(interactedBlogIds);
            log.info("Found {} blogs that tag blogs user {} interacted with", taggingBlogIds.size(), currentUserId);
            
            return taggingBlogIds;
        } catch (Exception e) {
            log.error("Failed to get social context blog IDs for user {}: {}", currentUserId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }
}

