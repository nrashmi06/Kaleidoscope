package com.kaleidoscope.backend.shared.service.impl;

import com.kaleidoscope.backend.async.mapper.AsyncMapper;
import com.kaleidoscope.backend.async.service.RedisStreamPublisher;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.shared.exception.other.HashTagNotFoundException;
import com.kaleidoscope.backend.shared.model.Hashtag;
import com.kaleidoscope.backend.shared.model.PostHashtag;
import com.kaleidoscope.backend.shared.repository.HashtagRepository;
import com.kaleidoscope.backend.shared.repository.PostHashtagRepository;
import com.kaleidoscope.backend.shared.service.HashtagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HashtagServiceImpl implements HashtagService {

    private final HashtagRepository hashtagRepository;
    private final PostHashtagRepository postHashtagRepository;
    private final RedisStreamPublisher redisStreamPublisher;
    private final JwtUtils jwtUtils;

    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#([a-zA-Z0-9_]+)");
    private static final String HASHTAG_USAGE_SYNC_STREAM = "hashtag-usage-sync-stream";

    @Override
    public Set<String> parseHashtags(String content) {
        if (content == null || content.trim().isEmpty()) {
            return Collections.emptySet();
        }

        Set<String> hashtags = new HashSet<>();
        Matcher matcher = HASHTAG_PATTERN.matcher(content);

        while (matcher.find()) {
            String hashtag = matcher.group(1).toLowerCase(); // Normalize to lowercase
            if (hashtag.length() <= 50) { // Respect DB constraint
                hashtags.add(hashtag);
            }
        }

        log.debug("Parsed {} hashtags from content", hashtags.size());
        return hashtags;
    }

    @Override
    @Transactional
    public List<Hashtag> findOrCreateHashtags(Set<String> hashtagNames) {
        if (hashtagNames == null || hashtagNames.isEmpty()) {
            return Collections.emptyList();
        }

        log.info("Finding or creating {} hashtags", hashtagNames.size());

        // Normalize hashtag names to lowercase
        Set<String> normalizedNames = hashtagNames.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        // Find existing hashtags
        List<Hashtag> existingHashtags = hashtagRepository.findByNameIn(new ArrayList<>(normalizedNames));
        Set<String> existingNames = existingHashtags.stream()
                .map(Hashtag::getName)
                .collect(Collectors.toSet());

        // Create new hashtags for names that don't exist
        List<Hashtag> newHashtags = normalizedNames.stream()
                .filter(name -> !existingNames.contains(name))
                .map(name -> Hashtag.builder()
                        .name(name)
                        .usageCount(0)
                        .build())
                .collect(Collectors.toList());

        if (!newHashtags.isEmpty()) {
            newHashtags = hashtagRepository.saveAll(newHashtags);
            log.info("Created {} new hashtags", newHashtags.size());
        }

        List<Hashtag> allHashtags = new ArrayList<>();
        allHashtags.addAll(existingHashtags);
        allHashtags.addAll(newHashtags);

        return allHashtags;
    }

    @Override
    @Transactional
    public void associateHashtagsWithPost(Post post, Set<Hashtag> hashtags) {
        if (post == null || hashtags == null || hashtags.isEmpty()) {
            return;
        }

        log.info("Associating {} hashtags with post {}", hashtags.size(), post.getPostId());

        List<PostHashtag> postHashtags = hashtags.stream()
                .map(hashtag -> PostHashtag.builder()
                        .post(post)
                        .hashtag(hashtag)
                        .build())
                .collect(Collectors.toList());

        postHashtagRepository.saveAll(postHashtags);
        log.info("Successfully associated {} hashtags with post {}", postHashtags.size(), post.getPostId());
    }

    @Override
    @Transactional
    public void disassociateHashtagsFromPost(Post post, Set<Hashtag> hashtags) {
        if (post == null || hashtags == null || hashtags.isEmpty()) {
            return;
        }

        log.info("Disassociating {} hashtags from post {}", hashtags.size(), post.getPostId());

        for (Hashtag hashtag : hashtags) {
            postHashtagRepository.deleteByPostAndHashtag(post, hashtag);
        }

        log.info("Successfully disassociated {} hashtags from post {}", hashtags.size(), post.getPostId());
    }

    @Override
    public void triggerHashtagUsageUpdate(Set<Hashtag> addedHashtags, Set<Hashtag> removedHashtags) {
        // Process added hashtags (increment)
        if (addedHashtags != null && !addedHashtags.isEmpty()) {
            log.info("Triggering async hashtag usage increment for {} hashtags", addedHashtags.size());
            for (Hashtag hashtag : addedHashtags) {
                Map<String, Object> event = AsyncMapper.toHashtagUsageEvent(hashtag.getName(), 1);

                try {
                    redisStreamPublisher.publish(HASHTAG_USAGE_SYNC_STREAM, event);
                } catch (Exception e) {
                    log.error("Failed to publish hashtag usage increment event for hashtag: {}", hashtag.getName(), e);
                }
            }
        }

        // Process removed hashtags (decrement)
        if (removedHashtags != null && !removedHashtags.isEmpty()) {
            log.info("Triggering async hashtag usage decrement for {} hashtags", removedHashtags.size());
            for (Hashtag hashtag : removedHashtags) {
                Map<String, Object> event = AsyncMapper.toHashtagUsageEvent(hashtag.getName(), -1);

                try {
                    redisStreamPublisher.publish(HASHTAG_USAGE_SYNC_STREAM, event);
                } catch (Exception e) {
                    log.error("Failed to publish hashtag usage decrement event for hashtag: {}", hashtag.getName(), e);
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Hashtag> getTrendingHashtags(Pageable pageable) {
        log.info("Fetching trending hashtags with pagination: {}", pageable);
        List<Hashtag> allHashtags = hashtagRepository.findAllOrderByUsageCountDesc();

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allHashtags.size());

        List<Hashtag> pageContent = allHashtags.subList(start, end);

        return new PageImpl<>(pageContent, pageable, allHashtags.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Hashtag> suggestHashtags(String prefix, Pageable pageable) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return Page.empty(pageable);
        }

        log.info("Fetching hashtag suggestions for prefix: '{}' with pagination: {}", prefix, pageable);
        String normalizedPrefix = prefix.toLowerCase().trim();
        
        // Remove # if present at the start
        if (normalizedPrefix.startsWith("#")) {
            normalizedPrefix = normalizedPrefix.substring(1);
        }

        List<Hashtag> suggestions = hashtagRepository.findByNameStartingWithIgnoreCaseOrderByUsageCountDesc(
                normalizedPrefix, pageable);

        // Convert List to Page
        return new PageImpl<>(suggestions, pageable, suggestions.size());
    }

    @Override
    @Transactional
    public void deleteHashtagById(Long hashtagId) {
        log.info("Attempting to delete hashtag with ID: {}", hashtagId);

        // Check if user is admin
        try {
            String role = jwtUtils.getRoleFromContext();
            if (!"ADMIN".equals(role)) {
                log.warn("Non-admin user attempted to delete hashtag: {}", hashtagId);
                throw new AccessDeniedException("Only administrators can delete hashtags");
            }
        } catch (Exception e) {
            log.error("Error checking admin role for hashtag deletion", e);
            throw new AccessDeniedException("Access denied");
        }

        // Find the hashtag
        Hashtag hashtag = hashtagRepository.findById(hashtagId)
                .orElseThrow(() -> {
                    log.error("Hashtag not found with ID: {}", hashtagId);
                    return new HashTagNotFoundException("Hashtag", "hashtagId", hashtagId);
                });

        // First delete all associations from the join table
        log.info("Deleting all post associations for hashtag: {}", hashtag.getName());
        postHashtagRepository.deleteAllByHashtag(hashtag);

        // Then delete the hashtag itself
        log.info("Deleting hashtag: {}", hashtag.getName());
        hashtagRepository.delete(hashtag);

        log.info("Successfully deleted hashtag with ID: {}", hashtagId);
    }
}
