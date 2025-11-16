package com.kaleidoscope.backend.blogs.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.blogs.dto.response.BlogSaveResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.blogs.exception.Blogs.BlogNotFoundException;
import com.kaleidoscope.backend.blogs.mapper.BlogMapper;
import com.kaleidoscope.backend.blogs.mapper.BlogSaveMapper;
import com.kaleidoscope.backend.blogs.model.Blog;
import com.kaleidoscope.backend.blogs.model.BlogSave;
import com.kaleidoscope.backend.blogs.repository.BlogRepository;
import com.kaleidoscope.backend.blogs.repository.BlogSaveRepository;
import com.kaleidoscope.backend.blogs.service.BlogSaveService;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlogSaveServiceImpl implements BlogSaveService {

    private final BlogSaveRepository blogSaveRepository;
    private final BlogRepository blogRepository;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final BlogMapper blogMapper;

    @Override
    @Transactional
    public BlogSaveResponseDTO saveOrUnsaveBlog(Long blogId, boolean unsave) {
        log.info("Processing save/unsave request for blogId: {}, unsave: {}", blogId, unsave);
        
        Long userId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            throw new IllegalArgumentException("Authenticated user not found for ID: " + userId);
        }

        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new BlogNotFoundException(blogId));

        Optional<BlogSave> existingSave = blogSaveRepository.findByBlogAndUser(blog, currentUser);

        if (unsave) {
            if (existingSave.isPresent()) {
                blogSaveRepository.deleteByBlogAndUser(blog, currentUser);
                log.info("Blog unsaved successfully: blogId={}, userId={}", blogId, userId);
            } else {
                log.warn("Attempting to unsave a blog that wasn't saved: blogId={}, userId={}", blogId, userId);
            }
        } else {
            if (existingSave.isEmpty()) {
                // Use mapper to create BlogSave entity
                BlogSave blogSave = BlogSaveMapper.toEntity(blog, currentUser);
                blogSaveRepository.save(blogSave);
                log.info("Blog saved successfully: blogId={}, userId={}", blogId, userId);
            } else {
                log.info("Blog already saved by user: blogId={}, userId={}", blogId, userId);
            }
        }

        return buildResponse(blog, currentUser);
    }

    @Override
    public BlogSaveResponseDTO getBlogSaveStatus(Long blogId) {
        log.info("Getting save status for blogId: {}", blogId);
        
        Long userId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            throw new IllegalArgumentException("Authenticated user not found for ID: " + userId);
        }

        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new BlogNotFoundException(blogId));

        return buildResponse(blog, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<BlogSummaryResponseDTO> getSavedBlogs(Pageable pageable) {
        log.info("Getting saved blogs for current user with pagination: page={}, size={}",
                pageable.getPageNumber(), pageable.getPageSize());

        Long userId = jwtUtils.getUserIdFromContext();
        User currentUser = userRepository.findByUserId(userId);
        if (currentUser == null) {
            throw new IllegalArgumentException("Authenticated user not found for ID: " + userId);
        }

        // Get saved blogs with pagination
        Page<BlogSave> savedBlogsPage = blogSaveRepository.findByUserOrderByCreatedAtDesc(currentUser, pageable);

        // Extract blogs and map to BlogSummaryResponseDTO
        List<BlogSummaryResponseDTO> blogSummaries = savedBlogsPage.getContent()
                .stream()
                .map(BlogSave::getBlog)
                .map(blogMapper::toBlogSummaryDTO)
                .toList();

        Page<BlogSummaryResponseDTO> dtoPage = new PageImpl<>(
                blogSummaries,
                pageable,
                savedBlogsPage.getTotalElements()
        );

        log.info("Retrieved {} saved blogs for user {}", blogSummaries.size(), userId);
        return PaginatedResponse.fromPage(dtoPage);
    }

    private BlogSaveResponseDTO buildResponse(Blog blog, User user) {
        Optional<BlogSave> userSave = blogSaveRepository.findByBlogAndUser(blog, user);
        long totalSaves = blogSaveRepository.countByBlog(blog);

        // Use mapper to create response DTO
        return BlogSaveMapper.toResponseDTO(userSave, totalSaves);
    }
}

