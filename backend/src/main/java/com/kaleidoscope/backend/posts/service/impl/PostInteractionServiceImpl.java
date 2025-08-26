package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.dto.response.PostReactionResponseDTO;
import com.kaleidoscope.backend.posts.enums.ReactionType;
import com.kaleidoscope.backend.posts.exception.Posts.PostNotFoundException;
import com.kaleidoscope.backend.posts.mapper.PostReactionMapper;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostReaction;
import com.kaleidoscope.backend.posts.repository.PostReactionRepository;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.service.PostInteractionService;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final PostReactionMapper postReactionMapper;

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
}
