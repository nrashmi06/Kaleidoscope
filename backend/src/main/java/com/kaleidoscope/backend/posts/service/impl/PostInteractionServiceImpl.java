package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.dto.response.PostCommentResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostReactionResponseDTO;
import com.kaleidoscope.backend.posts.enums.ReactionType;
import com.kaleidoscope.backend.posts.exception.Comments.CommentPostMismatchException;
import com.kaleidoscope.backend.posts.exception.Comments.CommentUnauthorizedException;
import com.kaleidoscope.backend.posts.exception.Comments.CommentNotFoundException;
import com.kaleidoscope.backend.posts.exception.Posts.PostNotFoundException;
import com.kaleidoscope.backend.posts.mapper.PostCommentMapper;
import com.kaleidoscope.backend.posts.mapper.PostReactionMapper;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostComment;
import com.kaleidoscope.backend.posts.model.PostReaction;
import com.kaleidoscope.backend.posts.repository.PostCommentRepository;
import com.kaleidoscope.backend.posts.repository.PostReactionRepository;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.service.PostInteractionService;
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
public class PostInteractionServiceImpl implements PostInteractionService {

    private final PostRepository postRepository;
    private final PostReactionRepository postReactionRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final PostReactionMapper postReactionMapper;
    private final PostCommentMapper postCommentMapper;

    @Override
    @Transactional
    public PostReactionResponseDTO reactOrUnreact(Long postId, ReactionType reactionType, boolean unreact) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(currentUserId);
        if (currentUser == null) {
            throw new IllegalStateException("Authenticated user not found for ID: " + currentUserId);
        }

        Post post = postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));

        var existingOpt = postReactionRepository.findAnyByPostIdAndUserIdIncludeDeleted(postId, currentUserId);
        if (unreact) {
            existingOpt.ifPresent(existing -> {
                existing.setDeletedAt(LocalDateTime.now());
                postReactionRepository.save(existing);
            });
        } else {
            if (existingOpt.isPresent()) {
                PostReaction existing = existingOpt.get();
                existing.setDeletedAt(null);
                existing.setReactionType(reactionType);
                postReactionRepository.save(existing);
            } else {
                PostReaction reaction = PostReaction.builder()
                        .post(post)
                        .user(currentUser)
                        .reactionType(reactionType)
                        .build();
                postReactionRepository.save(reaction);
            }
        }

        return getReactionSummary(postId);
    }

    @Override
    @Transactional(readOnly = true)
    public PostReactionResponseDTO getReactionSummary(Long postId) {
        postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));
        Long currentUserId = jwtUtils.getUserIdFromContext();
        ReactionType currentUserReaction = postReactionRepository
                .findByPostIdAndUserId(postId, currentUserId)
                .map(PostReaction::getReactionType)
                .orElse(null);
        List<Object[]> counts = postReactionRepository.countReactionsByPostIdGroupedByType(postId);
        return postReactionMapper.toReactionSummary(postId, currentUserReaction, counts);
    }

    @Override
    @Transactional
    public PostCommentResponseDTO addComment(Long postId, String body) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(currentUserId);
        if (currentUser == null) {
            throw new IllegalStateException("Authenticated user not found for ID: " + currentUserId);
        }

        Post post = postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));
        PostComment comment = PostComment.builder()
                .post(post)
                .user(currentUser)
                .body(body)
                .build();
        PostComment saved = postCommentRepository.save(comment);
        return postCommentMapper.toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PostCommentResponseDTO> listComments(Long postId, Pageable pageable) {
        postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));
        Page<PostComment> page = postCommentRepository.findAll((root, q, cb) -> cb.equal(root.get("post").get("postId"), postId), pageable);
        return page.map(postCommentMapper::toDTO);
    }

    @Override
    @Transactional
    public void deleteComment(Long postId, Long commentId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        boolean isAdmin = jwtUtils.isAdminFromContext();
        PostComment comment = postCommentRepository.findById(commentId)
            .orElseThrow(() -> new CommentNotFoundException(commentId));
        if (!comment.getPost().getPostId().equals(postId)) {
            throw new CommentPostMismatchException(commentId, postId);
        }
        if (!isAdmin && !comment.getUser().getUserId().equals(currentUserId)) {
            throw new CommentUnauthorizedException(commentId);
        }
        postCommentRepository.delete(comment);
    }
}
