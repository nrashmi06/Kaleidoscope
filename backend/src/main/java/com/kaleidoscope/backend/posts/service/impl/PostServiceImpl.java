package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.dto.request.PostCreateRequestDTO;
import com.kaleidoscope.backend.posts.dto.request.PostUpdateRequestDTO;
import com.kaleidoscope.backend.posts.dto.response.PostCreationResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostDetailResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import com.kaleidoscope.backend.posts.exception.Posts.PostNotFoundException;
import com.kaleidoscope.backend.posts.exception.Posts.UnauthorizedActionException;
import com.kaleidoscope.backend.posts.mapper.PostMapper;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.repository.search.PostSearchRepository;
import com.kaleidoscope.backend.posts.service.PostService;
import com.kaleidoscope.backend.posts.service.PostCommandService;
import com.kaleidoscope.backend.posts.service.PostViewService;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.exception.locationException.LocationNotFoundException;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.shared.repository.LocationRepository;
import com.kaleidoscope.backend.shared.repository.ReactionRepository;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final LocationRepository locationRepository;
    private final PostMapper postMapper;
    private final ReactionRepository reactionRepository;
    private final JwtUtils jwtUtils;
    private final FollowRepository followRepository;
    private final PostCommandService postCommandService;
    private final PostViewService postViewService;
    private final PostSearchRepository postSearchRepository;
    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public PostCreationResponseDTO createPost(PostCreateRequestDTO postCreateRequestDTO) {
        return postCommandService.createPost(postCreateRequestDTO);
    }

    @Override
    public PostCreationResponseDTO updatePost(Long postId, PostUpdateRequestDTO requestDTO) {
        return postCommandService.updatePost(postId, requestDTO);
    }

    @Override
    public void softDeletePost(Long postId) {
        postCommandService.softDeletePost(postId);
    }

    @Override
    public void hardDeletePost(Long postId) {
        postCommandService.hardDeletePost(postId);
    }

    @Override
    @Transactional(readOnly = true)
    public PostDetailResponseDTO getPostById(Long postId) {
        log.info("Fetching post details for postId: {}", postId);
        Post post = postRepository.findById(postId).orElseThrow(() -> {
            log.error("Post not found: {}", postId);
            return new PostNotFoundException(postId);
        });

        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        boolean isOwner = post.getUser().getUserId().equals(currentUserId);

        // Access control validation
        if (!isAdmin && !isOwner) {
            // Non-admin, non-owner users can only see PUBLISHED posts
            if (post.getStatus() != PostStatus.PUBLISHED) {
                log.error("Access denied: User {} cannot view unpublished post {}", currentUserId, postId);
                throw new UnauthorizedActionException("Not allowed to view this post");
            }

            // For FOLLOWERS visibility, check if current user follows the author
            if (post.getVisibility() == PostVisibility.FOLLOWERS) {
                boolean isFollowing = followRepository.existsByFollower_UserIdAndFollowing_UserId(
                        currentUserId, post.getUser().getUserId());
                if (!isFollowing) {
                    log.error("Access denied: User {} is not following author {} for FOLLOWERS post {}",
                            currentUserId, post.getUser().getUserId(), postId);
                    throw new UnauthorizedActionException("Not allowed to view this post");
                }
            }
        }

        // Track view count using Redis optimization (only for non-owners)
        if (!isOwner) {
            postViewService.incrementViewAsync(postId, currentUserId);
            log.debug("View tracking initiated for post {} by user {}", postId, currentUserId);

            // Track this post as viewed for suggestions filtering
            trackPostViewAsync(currentUserId, postId);
        }

        com.kaleidoscope.backend.shared.enums.ReactionType currentUserReaction = null;
        var reactionOpt = reactionRepository.findByContentAndUser(postId, ContentType.POST, currentUserId);
        if (reactionOpt.isPresent()) {
            currentUserReaction = reactionOpt.get().getReactionType();
        }
        log.debug("Returning post detail DTO for postId: {}", postId);
        return postMapper.toPostDetailDTO(post, currentUserReaction);
    }

    /**
     * Asynchronously track a post view for filtering in suggestions
     * Stores the viewed post ID in a Redis Set with 7-day expiry
     *
     * @param userId The ID of the user who viewed the post
     * @param postId The ID of the post that was viewed
     */
    @org.springframework.scheduling.annotation.Async("taskExecutor")
    public void trackPostViewAsync(Long userId, Long postId) {
        try {
            String viewedKey = "viewed_posts:" + userId;
            stringRedisTemplate.opsForSet().add(viewedKey, postId.toString());
            stringRedisTemplate.expire(viewedKey, 7, TimeUnit.DAYS);
            log.debug("Tracked viewed post {} for user {} in Redis with 7-day expiry", postId, userId);
        } catch (Exception e) {
            log.error("Failed to track viewed post {} for user {} in Redis: {}", postId, userId, e.getMessage());
            // Don't throw - this is a non-critical feature
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<PostSummaryResponseDTO> filterPosts(Pageable pageable,
            Long userId,
            Long categoryId,
            PostStatus status,
            PostVisibility visibility,
            String query,
            String hashtag,
            Long locationId,
            Long nearbyLocationId,
            Double radiusKm) {
        log.info(
                "Filtering posts with Elasticsearch: userId={}, categoryId={}, status={}, visibility={}, query={}, hashtag={}, locationId={}, nearbyLocationId={}, radiusKm={}",
                userId, categoryId, status, visibility, query, hashtag, locationId, nearbyLocationId, radiusKm);

        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();

        // For non-admin users, get following IDs for visibility rules
        Set<Long> followingIds = null;
        if (!isAdmin && currentUserId != null) {
            followingIds = followRepository.findFollowingIdsByFollowerId(currentUserId);
            log.debug("Retrieved {} following IDs for user {}", followingIds.size(), currentUserId);
        }

        // Handle nearbyLocationId - fetch coordinates for geo-distance query
        Double latitude = null;
        Double longitude = null;
        if (nearbyLocationId != null) {
            log.debug("Fetching coordinates for nearbyLocationId: {}", nearbyLocationId);
            Location location = locationRepository.findById(nearbyLocationId)
                    .orElseThrow(
                            () -> new LocationNotFoundException("Location not found with ID: " + nearbyLocationId));

            if (location.getLatitude() != null && location.getLongitude() != null) {
                latitude = location.getLatitude().doubleValue();
                longitude = location.getLongitude().doubleValue();
                log.info("Using geo-distance query: center=({}, {}), radius={}km", latitude, longitude, radiusKm);
            } else {
                log.warn("Location {} exists but has no coordinates. Geo-distance query will be skipped.",
                        nearbyLocationId);
            }
        }

        // Use the custom Elasticsearch repository method
        Page<PostDocument> documentPage = postSearchRepository.findVisibleAndFilteredPosts(
                currentUserId,
                followingIds,
                userId,
                categoryId,
                status,
                visibility,
                query,
                hashtag,
                locationId,
                latitude,
                longitude,
                radiusKm,
                pageable);

        // Map PostDocument to PostSummaryResponseDTO using the new overloaded mapper
        // method
        Page<PostSummaryResponseDTO> dtoPage = documentPage.map(postMapper::toPostSummaryDTO);

        log.info("Elasticsearch query returned {} posts out of {} total",
                dtoPage.getNumberOfElements(), dtoPage.getTotalElements());

        return PaginatedResponse.fromPage(dtoPage);
    }
}
