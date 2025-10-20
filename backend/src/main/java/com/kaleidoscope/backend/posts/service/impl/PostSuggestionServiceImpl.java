package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.mapper.PostMapper;
import com.kaleidoscope.backend.posts.repository.search.PostSearchRepository;
import com.kaleidoscope.backend.posts.service.PostSuggestionService;
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

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Implementation of PostSuggestionService
 * Generates personalized post suggestions using Elasticsearch function_score queries
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PostSuggestionServiceImpl implements PostSuggestionService {

    private final JwtUtils jwtUtils;
    private final UserSearchRepository userSearchRepository;
    private final FollowRepository followRepository;
    private final PostSearchRepository postSearchRepository;
    private final PostMapper postMapper;
    private final StringRedisTemplate stringRedisTemplate;
    private final com.kaleidoscope.backend.shared.service.HashtagService hashtagService;

    @Override
    public PaginatedResponse<PostSummaryResponseDTO> getPostSuggestions(Pageable pageable) {
        // 1. Get current user ID from JWT context
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Generating post suggestions for user: {}", currentUserId);

        // 2. Fetch UserDocument for current user to get interests and blocked users
        Optional<UserDocument> userDocumentOpt = userSearchRepository.findById(String.valueOf(currentUserId));
        
        if (userDocumentOpt.isEmpty()) {
            log.warn("UserDocument not found for userId: {}. Returning empty suggestions.", currentUserId);
            return PaginatedResponse.fromPage(Page.empty(pageable));
        }

        UserDocument userDocument = userDocumentOpt.get();
        
        // 3. Extract user context data
        List<Long> interestIds = userDocument.getInterests() != null ? userDocument.getInterests() : Collections.emptyList();
        List<Long> blockedUserIds = userDocument.getBlockedUserIds() != null ? userDocument.getBlockedUserIds() : Collections.emptyList();
        List<Long> blockedByUserIds = userDocument.getBlockedByUserIds() != null ? userDocument.getBlockedByUserIds() : Collections.emptyList();
        
        log.debug("User context - Interests: {}, Blocked users: {}, Blocked by: {}", 
                  interestIds.size(), blockedUserIds.size(), blockedByUserIds.size());

        // 4. Get following IDs from FollowRepository
        Set<Long> followingIds = followRepository.findFollowingIdsByFollowerId(currentUserId);
        log.debug("User is following {} users", followingIds.size());

        // 5. Fetch viewed post IDs from Redis to filter them out of suggestions
        Set<String> viewedPostIds;
        try {
            String viewedKey = "viewed_posts:" + currentUserId;
            viewedPostIds = stringRedisTemplate.opsForSet().members(viewedKey);
            if (viewedPostIds == null) {
                viewedPostIds = Collections.emptySet();
            }
            log.info("Retrieved {} viewed post IDs from Redis for user {}", viewedPostIds.size(), currentUserId);
        } catch (Exception e) {
            log.error("Failed to fetch viewed post IDs from Redis for user {}: {}", currentUserId, e.getMessage());
            viewedPostIds = Collections.emptySet();
        }

        // 6. Fetch trending hashtags to boost in suggestions
        List<String> trendingHashtagNames;
        try {
            trendingHashtagNames = hashtagService.getTrendingHashtags(org.springframework.data.domain.PageRequest.of(0, 10))
                    .stream()
                    .map(com.kaleidoscope.backend.shared.model.Hashtag::getName)
                    .collect(java.util.stream.Collectors.toList());
            log.info("Retrieved {} trending hashtags for boosting suggestions", trendingHashtagNames.size());
        } catch (Exception e) {
            log.error("Failed to fetch trending hashtags: {}", e.getMessage());
            trendingHashtagNames = Collections.emptyList();
        }

        // 7. Call repository method to find post suggestions with viewed posts filter and trending hashtags
        Page<PostDocument> postDocuments = postSearchRepository.findPostSuggestions(
                currentUserId,
                followingIds,
                interestIds,
                blockedUserIds,
                blockedByUserIds,
                viewedPostIds,
                trendingHashtagNames,
                pageable
        );

        log.info("Found {} post suggestions for user {}", postDocuments.getTotalElements(), currentUserId);

        // 8. Map PostDocument to PostSummaryResponseDTO
        Page<PostSummaryResponseDTO> postSummaries = postDocuments.map(postMapper::toPostSummaryDTO);

        // 9. Return paginated response
        return PaginatedResponse.fromPage(postSummaries);
    }
}
