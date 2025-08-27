package com.kaleidoscope.backend.shared.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.dto.response.CommentReactionResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.CommentResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.ReactionResponseDTO;
import com.kaleidoscope.backend.shared.enums.ReactionType;
import com.kaleidoscope.backend.shared.exception.Comments.CommentNotFoundException;
import com.kaleidoscope.backend.shared.exception.Comments.CommentPostMismatchException;
import com.kaleidoscope.backend.shared.exception.Comments.CommentUnauthorizedException;
import com.kaleidoscope.backend.posts.exception.Posts.PostNotFoundException;
import com.kaleidoscope.backend.shared.mapper.InteractionMapper;
import com.kaleidoscope.backend.shared.model.CommentReaction;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.shared.model.Comment;
import com.kaleidoscope.backend.shared.model.Reaction;
import com.kaleidoscope.backend.shared.repository.CommentReactionRepository;
import com.kaleidoscope.backend.shared.repository.CommentRepository;
import com.kaleidoscope.backend.shared.repository.ReactionRepository;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.shared.service.InteractionService;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class InteractionServiceImpl implements InteractionService {

    private final PostRepository postRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final InteractionMapper interactionMapper;
    private final CommentReactionRepository commentReactionRepository;

    @Override
    @Transactional
    public ReactionResponseDTO reactOrUnreact(Long postId, ReactionType reactionType, boolean unreact) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(currentUserId);
        if (currentUser == null) {
            throw new IllegalStateException("Authenticated user not found for ID: " + currentUserId);
        }

        Post post = postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));

        var existingOpt = reactionRepository.findAnyByPostIdAndUserIdIncludeDeleted(postId, currentUserId);
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
                        .post(post)
                        .user(currentUser)
                        .reactionType(reactionType)
                        .build();
                reactionRepository.save(reaction);
            }
        }

        return getReactionSummary(postId);
    }

    @Override
    @Transactional(readOnly = true)
    public ReactionResponseDTO getReactionSummary(Long postId) {
        postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));
        Long currentUserId = jwtUtils.getUserIdFromContext();
        ReactionType currentUserReaction = reactionRepository
                .findByPostIdAndUserId(postId, currentUserId)
                .map(Reaction::getReactionType)
                .orElse(null);
        List<Object[]> counts = reactionRepository.countReactionsByPostIdGroupedByType(postId);
        return interactionMapper.toPostReactionSummary(postId, currentUserReaction, counts);
    }

    @Override
    @Transactional
    public CommentResponseDTO addComment(Long postId, String body) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(currentUserId);
        if (currentUser == null) {
            throw new IllegalStateException("Authenticated user not found for ID: " + currentUserId);
        }

        Post post = postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));
        Comment comment = Comment.builder()
                .post(post)
                .user(currentUser)
                .body(body)
                .build();
        Comment saved = commentRepository.save(comment);
        return interactionMapper.toCommentDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponseDTO> listComments(Long postId, Pageable pageable) {
        postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));
        Page<Comment> page = commentRepository.findAll((root, q, cb) -> cb.equal(root.get("post").get("postId"), postId), pageable);
        return page.map(interactionMapper::toCommentDTO);
    }

    @Override
    @Transactional
    public void deleteComment(Long postId, Long commentId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new CommentNotFoundException(commentId));
        if (!comment.getPost().getPostId().equals(postId)) {
            throw new CommentPostMismatchException(commentId, postId);
        }
        if (!isAdmin && !comment.getUser().getUserId().equals(currentUserId)) {
            throw new CommentUnauthorizedException(commentId);
        }
        commentRepository.delete(comment);
    }

    @Override
    @Transactional
    public CommentReactionResponseDTO reactOrUnreactToComment(Long postId, Long commentId, ReactionType reactionType, boolean unreact) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(currentUserId);
        if (currentUser == null) {
            throw new IllegalStateException("Authenticated user not found for ID: " + currentUserId);
        }
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new CommentNotFoundException(commentId));
        if (!comment.getPost().getPostId().equals(postId)) {
            throw new CommentPostMismatchException(commentId, postId);
        }
        var existingOpt = commentReactionRepository.findAnyByCommentIdAndUserIdIncludeDeleted(commentId, currentUserId);
        if (unreact) {
            existingOpt.ifPresent(existing -> {
                existing.setDeletedAt(LocalDateTime.now());
                commentReactionRepository.save(existing);
            });
        } else {
            if (existingOpt.isPresent()) {
                var existing = existingOpt.get();
                existing.setDeletedAt(null);
                existing.setReactionType(reactionType);
                commentReactionRepository.save(existing);
            } else {
                var reaction = CommentReaction.builder()
                        .comment(comment)
                        .user(currentUser)
                        .reactionType(reactionType)
                        .build();
                commentReactionRepository.save(reaction);
            }
        }
        return getCommentReactionSummary(postId, commentId);
    }

    @Override
    @Transactional(readOnly = true)
    public CommentReactionResponseDTO getCommentReactionSummary(Long postId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new CommentNotFoundException(commentId));
        if (!comment.getPost().getPostId().equals(postId)) {
            throw new CommentPostMismatchException(commentId, postId);
        }
        Long currentUserId = jwtUtils.getUserIdFromContext();
        ReactionType currentUserReaction = commentReactionRepository
                .findByCommentIdAndUserId(commentId, currentUserId)
                .map(CommentReaction::getReactionType)
                .orElse(null);
        List<Object[]> counts = commentReactionRepository.countReactionsByCommentIdGroupedByType(commentId);
        return interactionMapper.toCommentReactionSummary(commentId, currentUserReaction, counts);
    }
}
