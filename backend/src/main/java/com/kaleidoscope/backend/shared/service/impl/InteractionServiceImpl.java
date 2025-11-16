package com.kaleidoscope.backend.shared.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.blogs.repository.BlogRepository;
import com.kaleidoscope.backend.async.service.RedisStreamPublisher;
import com.kaleidoscope.backend.async.streaming.ProducerStreamConstants;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.shared.dto.request.CommentCreateRequestDTO;
import com.kaleidoscope.backend.shared.dto.request.CreateUserTagRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.CommentResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.ReactionResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.shared.exception.Comments.CommentNotFoundException;
import com.kaleidoscope.backend.shared.exception.Comments.CommentPostMismatchException;
import com.kaleidoscope.backend.shared.exception.Comments.CommentUnauthorizedException;
import com.kaleidoscope.backend.shared.exception.other.ContentNotFoundException;
import com.kaleidoscope.backend.shared.mapper.InteractionMapper;
import com.kaleidoscope.backend.shared.mapper.UserTagMapper;
import com.kaleidoscope.backend.shared.model.Comment;
import com.kaleidoscope.backend.shared.model.Reaction;
import com.kaleidoscope.backend.shared.model.UserTag;
import com.kaleidoscope.backend.shared.repository.CommentRepository;
import com.kaleidoscope.backend.shared.repository.ReactionRepository;
import com.kaleidoscope.backend.shared.repository.UserTagRepository;
import com.kaleidoscope.backend.shared.service.InteractionService;
import com.kaleidoscope.backend.shared.service.UserTagService;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InteractionServiceImpl implements InteractionService {

    private final PostRepository postRepository;
    private final BlogRepository blogRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final InteractionMapper interactionMapper;
    private final UserTagService userTagService;
    private final UserTagRepository userTagRepository;
    private final UserTagMapper userTagMapper;
    private final RedisStreamPublisher redisStreamPublisher;

    private void validateContentExists(ContentType contentType, Long contentId) {
        log.debug("[validateContentExists] Checking existence for contentType: {} and contentId: {}", contentType, contentId);
        boolean exists;
        switch (contentType) {
            case POST:
                exists = postRepository.existsById(contentId);
                break;
            case BLOG:
                exists = blogRepository.existsById(contentId);
                break;
            case COMMENT:
                exists = commentRepository.existsById(contentId);
                break;
            default:
                log.error("[validateContentExists] Unsupported content type: {}", contentType);
                throw new IllegalArgumentException("Content type not supported for interactions: " + contentType);
        }
        if (!exists) {
            log.warn("[validateContentExists] Content not found for contentType: {} and contentId: {}", contentType, contentId);
            throw new ContentNotFoundException(contentId);
        }
        log.debug("[validateContentExists] Content exists for contentType: {} and contentId: {}", contentType, contentId);
    }

    @Override
    @Transactional
    public ReactionResponseDTO reactOrUnreact(ContentType contentType, Long contentId, ReactionType reactionType, boolean unreact) {
        log.info("[reactOrUnreact] User reaction request: contentType={}, contentId={}, reactionType={}, unreact={}", contentType, contentId, reactionType, unreact);
        validateContentExists(contentType, contentId);
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.debug("[reactOrUnreact] Current userId: {}", currentUserId);
        User currentUser = userRepository.findByUserId(currentUserId);
        if (currentUser == null) {
            log.error("[reactOrUnreact] Authenticated user not found for ID: {}", currentUserId);
            throw new IllegalStateException("Authenticated user not found for ID: " + currentUserId);
        }
        var existingOpt = reactionRepository.findAnyByContentAndUserIncludeDeleted(contentId, contentType.name(), currentUserId);
        if (unreact) {
            existingOpt.ifPresent(existing -> {
                existing.setDeletedAt(LocalDateTime.now());
                reactionRepository.save(existing);
                log.info("[reactOrUnreact] Unreacted: reaction deleted for user {} on content {}:{}", currentUserId, contentType, contentId);
            });
        } else {
            if (existingOpt.isPresent()) {
                Reaction existing = existingOpt.get();
                existing.setDeletedAt(null);
                existing.setReactionType(reactionType);
                reactionRepository.save(existing);
                log.info("[reactOrUnreact] Updated reaction for user {} on content {}:{} to {}", currentUserId, contentType, contentId, reactionType);
            } else {
                Reaction reaction = Reaction.builder()
                        .contentType(contentType)
                        .contentId(contentId)
                        .user(currentUser)
                        .reactionType(reactionType)
                        .build();
                reactionRepository.save(reaction);
                log.info("[reactOrUnreact] Created new reaction for user {} on content {}:{} to {}", currentUserId, contentType, contentId, reactionType);

                // Publish notification event for NEW_REACTION (only for new reactions, not updates)
                try {
                    Long contentOwnerId = null;

                    // Determine content owner based on content type
                    if (contentType == ContentType.POST) {
                        contentOwnerId = postRepository.findById(contentId)
                            .map(post -> post.getUser().getUserId())
                            .orElse(null);
                    } else if (contentType == ContentType.BLOG) {
                        contentOwnerId = blogRepository.findById(contentId)
                            .map(blog -> blog.getUser().getUserId())
                            .orElse(null);
                    } else if (contentType == ContentType.COMMENT) {
                        contentOwnerId = commentRepository.findById(contentId)
                            .map(comment -> comment.getUser().getUserId())
                            .orElse(null);
                    }

                    // Only publish if content owner exists and is not the reactor
                    if (contentOwnerId != null && !contentOwnerId.equals(currentUserId)) {
                        Map<String, String> additionalData = Map.of(
                            "reactorUsername", currentUser.getUsername(),
                            "reactionType", reactionType.name()
                        );

                        com.kaleidoscope.backend.shared.enums.NotificationType notifType =
                            (contentType == ContentType.COMMENT)
                                ? com.kaleidoscope.backend.shared.enums.NotificationType.NEW_REACTION_COMMENT
                                : com.kaleidoscope.backend.shared.enums.NotificationType.NEW_REACTION_POST;

                        com.kaleidoscope.backend.async.dto.NotificationEventDTO notificationEvent =
                            new com.kaleidoscope.backend.async.dto.NotificationEventDTO(
                                notifType,
                                contentOwnerId,
                                currentUserId,
                                contentId,
                                contentType,
                                additionalData,
                                org.slf4j.MDC.get("correlationId")
                            );

                        redisStreamPublisher.publish("notification-events", notificationEvent);
                        log.debug("[reactOrUnreact] Published {} notification event for content owner {}", notifType, contentOwnerId);
                    }
                } catch (Exception e) {
                    log.error("[reactOrUnreact] Failed to publish notification event: {}", e.getMessage(), e);
                    // Continue execution even if notification publishing fails
                }
            }
        }

        // Trigger Elasticsearch sync for POST interactions only
        if (contentType == ContentType.POST) {
            try {
                // Create a simple event payload with postId for the sync consumer
                Map<String, Object> eventPayload = new HashMap<>();
                eventPayload.put("contentId", contentId);
                eventPayload.put("changeType", unreact ? "UNREACT" : "REACT");
                eventPayload.put("correlationId", org.slf4j.MDC.get("correlationId"));

                redisStreamPublisher.publish(ProducerStreamConstants.POST_INTERACTION_SYNC_STREAM, eventPayload);
                log.debug("[reactOrUnreact] Published POST_INTERACTION_SYNC_STREAM event for post {}", contentId);

            } catch (Exception e) {
                log.error("[reactOrUnreact] Failed to publish interaction sync event for post {}: {}",
                         contentId, e.getMessage(), e);
                // Continue execution even if stream publishing fails
            }
        }

        return getReactionSummary(contentType, contentId);
    }

    @Override
    @Transactional(readOnly = true)
    public ReactionResponseDTO getReactionSummary(ContentType contentType, Long contentId) {
        log.info("[getReactionSummary] Fetching reaction summary for contentType: {} and contentId: {}", contentType, contentId);
        validateContentExists(contentType, contentId);
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.debug("[getReactionSummary] Current userId: {}", currentUserId);
        ReactionType currentUserReaction = reactionRepository
                .findByContentAndUser(contentId, contentType, currentUserId)
                .map(Reaction::getReactionType)
                .orElse(null);
        List<Object[]> counts = reactionRepository.countReactionsByContentGroupedByType(contentId, contentType);
        log.debug("[getReactionSummary] Reaction counts: {}", counts);
        return interactionMapper.toReactionSummary(contentId, contentType, currentUserReaction, counts);
    }

    @Override
    @Transactional
    public CommentResponseDTO addComment(ContentType contentType, Long contentId, CommentCreateRequestDTO requestDTO) {
        log.info("[addComment] Adding comment for contentType: {} and contentId: {}", contentType, contentId);
        validateContentExists(contentType, contentId);
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.debug("[addComment] Current userId: {}", currentUserId);
        User currentUser = userRepository.findByUserId(currentUserId);
        if (currentUser == null) {
            log.error("[addComment] Authenticated user not found for ID: {}", currentUserId);
            throw new IllegalStateException("Authenticated user not found for ID: " + currentUserId);
        }
        Comment comment = Comment.builder()
                .contentType(contentType)
                .contentId(contentId)
                .user(currentUser)
                .body(requestDTO.body())
                .build();
        Comment savedComment = commentRepository.save(comment);
        log.info("[addComment] Saved comment with ID: {} for user: {}", savedComment.getCommentId(), currentUserId);

        // Publish notification event for NEW_COMMENT
        try {
            // Determine content owner based on content type
            Long contentOwnerId = null;
            if (contentType == ContentType.POST) {
                contentOwnerId = postRepository.findById(contentId)
                    .map(post -> post.getUser().getUserId())
                    .orElse(null);
            } else if (contentType == ContentType.BLOG) {
                contentOwnerId = blogRepository.findById(contentId)
                    .map(blog -> blog.getUser().getUserId())
                    .orElse(null);
            }

            // Only publish if content owner exists and is not the commenter
            if (contentOwnerId != null && !contentOwnerId.equals(currentUserId)) {
                Map<String, String> additionalData = Map.of(
                    "commenterUsername", currentUser.getUsername(),
                    "commentBody", savedComment.getBody().length() > 100
                        ? savedComment.getBody().substring(0, 100) + "..."
                        : savedComment.getBody()
                );

                com.kaleidoscope.backend.async.dto.NotificationEventDTO notificationEvent =
                    new com.kaleidoscope.backend.async.dto.NotificationEventDTO(
                        com.kaleidoscope.backend.shared.enums.NotificationType.NEW_COMMENT,
                        contentOwnerId,
                        currentUserId,
                        contentId,
                        contentType,
                        additionalData,
                        org.slf4j.MDC.get("correlationId")
                    );

                redisStreamPublisher.publish("notification-events", notificationEvent);
                log.debug("[addComment] Published NEW_COMMENT notification event for content owner {}", contentOwnerId);
            }
        } catch (Exception e) {
            log.error("[addComment] Failed to publish notification event: {}", e.getMessage(), e);
            // Continue execution even if notification publishing fails
        }

        if (requestDTO.taggedUserIds() != null && !requestDTO.taggedUserIds().isEmpty()) {
            for (Long taggedUserId : requestDTO.taggedUserIds()) {
                CreateUserTagRequestDTO tagRequest = new CreateUserTagRequestDTO(
                        taggedUserId,
                        ContentType.COMMENT,
                        savedComment.getCommentId()
                );
                userTagService.createUserTag(tagRequest);
                log.info("[addComment] Tagged user {} in comment {}", taggedUserId, savedComment.getCommentId());
            }
        }
        Set<UserTagResponseDTO> tags = userTagRepository.findByContentTypeAndContentId(ContentType.COMMENT, savedComment.getCommentId(), Pageable.unpaged())
            .stream()
            .map(userTagMapper::toDTO)
            .collect(Collectors.toSet());
        log.debug("[addComment] Fetched {} tags for comment {}", tags.size(), savedComment.getCommentId());

        // Trigger Elasticsearch sync for POST comments only
        if (contentType == ContentType.POST) {
            try {
                Map<String, Object> eventPayload = Map.of(
                    "contentId", contentId,
                    "changeType", "ADD_COMMENT"
                );

                redisStreamPublisher.publish(ProducerStreamConstants.POST_INTERACTION_SYNC_STREAM, eventPayload);
                log.debug("[addComment] Published POST_INTERACTION_SYNC_STREAM event for post {}", contentId);

            } catch (Exception e) {
                log.error("[addComment] Failed to publish interaction sync event for post {}: {}",
                         contentId, e.getMessage(), e);
                // Continue execution even if stream publishing fails
            }
        }

        return interactionMapper.toCommentDTO(savedComment, tags);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponseDTO> listComments(ContentType contentType, Long contentId, Pageable pageable) {
        log.info("[listComments] Listing comments for contentType: {} and contentId: {}", contentType, contentId);
        validateContentExists(contentType, contentId);
        Page<Comment> page = commentRepository.findAll(
                (root, q, cb) -> cb.and(
                        cb.equal(root.get("contentType"), contentType),
                        cb.equal(root.get("contentId"), contentId)
                ), pageable);
        log.debug("[listComments] Fetched {} comments", page.getTotalElements());
        return page.map(comment -> {
            Set<UserTagResponseDTO> tags = userTagRepository.findByContentTypeAndContentId(ContentType.COMMENT, comment.getCommentId(), Pageable.unpaged())
                .stream()
                .map(userTagMapper::toDTO)
                .collect(Collectors.toSet());
            log.debug("[listComments] Fetched {} tags for comment {}", tags.size(), comment.getCommentId());
            return interactionMapper.toCommentDTO(comment, tags);
        });
    }

    @Override
    @Transactional
    public void deleteComment(Long contentId, Long commentId) {
        log.info("[deleteComment] Deleting comment with ID: {} for contentId: {}", commentId, contentId);
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        log.debug("[deleteComment] Current userId: {}, isAdmin: {}", currentUserId, isAdmin);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));
        if (!comment.getContentId().equals(contentId)) {
            log.error("[deleteComment] Comment post mismatch: commentId={}, contentId={}", commentId, contentId);
            throw new CommentPostMismatchException(commentId, contentId);
        }
        if (!isAdmin && !comment.getUser().getUserId().equals(currentUserId)) {
            log.error("[deleteComment] Unauthorized delete attempt by user {} for comment {}", currentUserId, commentId);
            throw new CommentUnauthorizedException(commentId);
        }
        List<UserTag> tagsToDelete = userTagRepository.findByContentTypeAndContentId(ContentType.COMMENT, commentId, Pageable.unpaged()).getContent();
        if (!tagsToDelete.isEmpty()) {
            userTagRepository.deleteAll(tagsToDelete);
            log.info("[deleteComment] Deleted {} associated user tags for comment ID: {}", tagsToDelete.size(), commentId);
        }
        commentRepository.delete(comment);
        log.info("[deleteComment] Deleted comment with ID: {}", commentId);

        // Trigger Elasticsearch sync for POST comments only
        if (comment.getContentType() == ContentType.POST) {
            try {
                Map<String, Object> eventPayload = Map.of(
                    "contentId", contentId,
                    "changeType", "DELETE_COMMENT"
                );

                redisStreamPublisher.publish(ProducerStreamConstants.POST_INTERACTION_SYNC_STREAM, eventPayload);
                log.debug("[deleteComment] Published POST_INTERACTION_SYNC_STREAM event for post {}", contentId);

            } catch (Exception e) {
                log.error("[deleteComment] Failed to publish interaction sync event for post {}: {}",
                         contentId, e.getMessage(), e);
                // Continue execution even if stream publishing fails
            }
        } else if (comment.getContentType() == ContentType.BLOG) {
            try {
                Map<String, Object> eventPayload = Map.of(
                    "contentId", contentId,
                    "changeType", "DELETE_COMMENT"
                );

                redisStreamPublisher.publish(ProducerStreamConstants.BLOG_INTERACTION_SYNC_STREAM, eventPayload);
                log.debug("[deleteComment] Published BLOG_INTERACTION_SYNC_STREAM event for blog {}", contentId);

            } catch (Exception e) {
                log.error("[deleteComment] Failed to publish interaction sync event for blog {}: {}",
                         contentId, e.getMessage(), e);
                // Continue execution even if stream publishing fails
            }
        }
    }
}
