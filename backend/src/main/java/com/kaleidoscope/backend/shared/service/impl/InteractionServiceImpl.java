package com.kaleidoscope.backend.shared.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.blogs.repository.BlogRepository;
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
import com.kaleidoscope.backend.posts.exception.Posts.PostNotFoundException;
import com.kaleidoscope.backend.shared.mapper.InteractionMapper;
import com.kaleidoscope.backend.shared.mapper.UserTagMapper;
import com.kaleidoscope.backend.shared.model.Comment;
import com.kaleidoscope.backend.shared.model.Reaction;
import com.kaleidoscope.backend.shared.model.UserTag;
import com.kaleidoscope.backend.shared.repository.CommentRepository;
import com.kaleidoscope.backend.shared.repository.ReactionRepository;
import com.kaleidoscope.backend.posts.repository.PostRepository;
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
import java.util.List;
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

    private void validateContentExists(ContentType contentType, Long contentId) {
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
                throw new IllegalArgumentException("Content type not supported for interactions: " + contentType);
        }

        if (!exists) {
            throw new PostNotFoundException(contentId);
        }
    }

    @Override
    @Transactional
    public ReactionResponseDTO reactOrUnreact(ContentType contentType, Long contentId, ReactionType reactionType, boolean unreact) {
        validateContentExists(contentType, contentId);

        Long currentUserId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(currentUserId);
        if (currentUser == null) {
            throw new IllegalStateException("Authenticated user not found for ID: " + currentUserId);
        }

        var existingOpt = reactionRepository.findAnyByContentAndUserIncludeDeleted(contentId, contentType.name(), currentUserId);

        if (unreact) {
            existingOpt.ifPresent(existing -> {
                existing.setDeletedAt(LocalDateTime.now());
                reactionRepository.save(existing);
            });
        } else {
            if (existingOpt.isPresent()) {
                Reaction existing = existingOpt.get();
                existing.setDeletedAt(null);
                existing.setReactionType(reactionType);
                reactionRepository.save(existing);
            } else {
                Reaction reaction = Reaction.builder()
                        .contentType(contentType)
                        .contentId(contentId)
                        .user(currentUser)
                        .reactionType(reactionType)
                        .build();
                reactionRepository.save(reaction);
            }
        }
        return getReactionSummary(contentType, contentId);
    }

    @Override
    @Transactional(readOnly = true)
    public ReactionResponseDTO getReactionSummary(ContentType contentType, Long contentId) {
        validateContentExists(contentType, contentId);

        Long currentUserId = jwtUtils.getUserIdFromContext();
        ReactionType currentUserReaction = reactionRepository
                .findByContentAndUser(contentId, contentType, currentUserId)
                .map(Reaction::getReactionType)
                .orElse(null);
        List<Object[]> counts = reactionRepository.countReactionsByContentGroupedByType(contentId, contentType);
        return interactionMapper.toReactionSummary(contentId, contentType, currentUserReaction, counts);
    }

    @Override
    @Transactional
    public CommentResponseDTO addComment(ContentType contentType, Long contentId, CommentCreateRequestDTO requestDTO) {
        validateContentExists(contentType, contentId);
        Long currentUserId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(currentUserId);
        if (currentUser == null) {
            throw new IllegalStateException("Authenticated user not found for ID: " + currentUserId);
        }
        Comment comment = Comment.builder()
                .contentType(contentType)
                .contentId(contentId)
                .user(currentUser)
                .body(requestDTO.getBody())
                .build();
        Comment savedComment = commentRepository.save(comment);

        if (requestDTO.getTaggedUserIds() != null && !requestDTO.getTaggedUserIds().isEmpty()) {
            for (Long taggedUserId : requestDTO.getTaggedUserIds()) {
                CreateUserTagRequestDTO tagRequest = CreateUserTagRequestDTO.builder()
                        .taggedUserId(taggedUserId)
                        .contentId(savedComment.getCommentId())
                        .contentType(ContentType.COMMENT)
                        .build();
                userTagService.createUserTag(tagRequest);
            }
        }
        // Fetch and map tags for this comment
        Set<UserTagResponseDTO> tags = userTagRepository.findByContentTypeAndContentId(ContentType.COMMENT, savedComment.getCommentId(), Pageable.unpaged())
            .stream()
            .map(userTagMapper::toDTO)
            .collect(Collectors.toSet());
        return interactionMapper.toCommentDTO(savedComment, tags);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponseDTO> listComments(ContentType contentType, Long contentId, Pageable pageable) {
        validateContentExists(contentType, contentId);
        Page<Comment> page = commentRepository.findAll(
                (root, q, cb) -> cb.and(
                        cb.equal(root.get("contentType"), contentType),
                        cb.equal(root.get("contentId"), contentId)
                ), pageable);
        // For each comment, fetch and map tags
        return page.map(comment -> {
            Set<UserTagResponseDTO> tags = userTagRepository.findByContentTypeAndContentId(ContentType.COMMENT, comment.getCommentId(), Pageable.unpaged())
                .stream()
                .map(userTagMapper::toDTO)
                .collect(Collectors.toSet());
            return interactionMapper.toCommentDTO(comment, tags);
        });
    }

    @Override
    @Transactional
    public void deleteComment(Long contentId, Long commentId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));

        if (!comment.getContentId().equals(contentId)) {
            throw new CommentPostMismatchException(commentId, contentId);
        }
        if (!isAdmin && !comment.getUser().getUserId().equals(currentUserId)) {
            throw new CommentUnauthorizedException(commentId);
        }

        // Delete associated user tags before deleting the comment
        List<UserTag> tagsToDelete = userTagRepository.findByContentTypeAndContentId(ContentType.COMMENT, commentId, Pageable.unpaged()).getContent();
        if (!tagsToDelete.isEmpty()) {
            userTagRepository.deleteAll(tagsToDelete);
            log.info("Deleted {} associated user tags for comment ID: {}", tagsToDelete.size(), commentId);
        }

        commentRepository.delete(comment);
    }
}